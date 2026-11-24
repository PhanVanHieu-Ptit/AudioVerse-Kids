"""Render a local, review-only audition. Never publishes the playback manifest."""

import hashlib
import html
import importlib.metadata
import json
import os
from pathlib import Path
import shutil
import socket
import subprocess
import tempfile
import time

ROOT = Path(__file__).resolve().parents[2]
CACHE = ROOT / ".cache/local-tts/huggingface"
OUT = ROOT / "artifacts/voice-previews/nam-ke-chuyen"
REVISIONS = {
    "pnnbao-ump/VieNeu-TTS-v3-Turbo": "61b85e3d937fbbacb387714180e8182823512523",
    "OpenMOSS-Team/MOSS-Audio-Tokenizer-Nano-ONNX": "ceff0d0749bfb3fa2d61149794ec6feef0d1e1ae",
}


def deny_connection(*_args: object, **_kwargs: object) -> None:
    raise RuntimeError("Bản nghe thử chỉ dùng mô hình đã lưu cục bộ; cấm kết nối mạng.")


def run(args: list[str]) -> bytes:
    return subprocess.run(args, check=True, capture_output=True).stdout


def main() -> None:
    for executable in ("ffmpeg", "ffprobe"):
        if not shutil.which(executable):
            raise RuntimeError(f"Cần cài {executable} trước khi tạo bản thử.")
    if importlib.metadata.version("vieneu") != "3.8.5":
        raise RuntimeError("Quy trình này đã kiểm tra với vieneu==3.8.5.")
    for repo, revision in REVISIONS.items():
        model = CACHE / "hub" / ("models--" + repo.replace("/", "--"))
        if (model / "refs/main").read_text().strip() != revision:
            raise RuntimeError(f"Cache {repo} khác phiên bản đã kiểm tra: {revision}")
        if not (model / "snapshots" / revision).is_dir():
            raise RuntimeError(f"Chưa có mô hình cục bộ: {repo}@{revision}")
    os.environ.update({
        "HF_HOME": str(CACHE),
        "HF_HUB_OFFLINE": "1",
        "TRANSFORMERS_OFFLINE": "1",
        "HF_HUB_DISABLE_TELEMETRY": "1",
        "DO_NOT_TRACK": "1",
    })
    socket.socket.connect = deny_connection
    socket.socket.connect_ex = deny_connection
    socket.create_connection = deny_connection

    import numpy as np
    import soundfile as sf
    from vieneu import Vieneu

    started = time.monotonic()
    plan = json.loads((OUT / "plan.json").read_text())
    # A failed rerun must not leave a manifest claiming the new plan is ready.
    (OUT / "manifest.json").unlink(missing_ok=True)
    engine = Vieneu(mode="v3turbo", backend="onnx", device="cpu", precision="fp32", threads=4)
    cache = ROOT / ".cache/local-tts/audition-turns"
    cache.mkdir(parents=True, exist_ok=True)
    profile = {
        "sdkVersion": "3.8.5", "modelRevisions": REVISIONS,
        "backend": "onnx", "precision": "fp32", "temperature": 0.8,
        "seed": 20261123, "sampleRate": 48000, "applyWatermark": True,
        "styleInstructionsSupported": False,
        "normalization": "loudnorm=I=-20:TP=-3:LRA=7",
        "revision": 1,
    }
    results = []
    for candidate in plan["candidates"]:
        chunks = []
        timeline = []
        offset = 0
        for index, turn in enumerate(candidate["turns"]):
            if engine.resolve_voice_name(turn["voice"]) is None:
                raise RuntimeError(f"Không có preset {turn['voice']}")
            key = hashlib.sha256(json.dumps({"profile": profile, "turn": turn}, sort_keys=True, ensure_ascii=False).encode()).hexdigest()
            cached = cache / (key + ".wav")
            if not cached.exists():
                np.random.seed(profile["seed"])
                print(f"{candidate['id']} {index + 1}/{len(candidate['turns'])}: {turn['voice']}", flush=True)
                wav = np.asarray(engine.infer(text=turn["text"], voice=turn["voice"], temperature=profile["temperature"], apply_watermark=True), dtype=np.float32)
                if wav.ndim != 1 or not np.isfinite(wav).all() or wav.size < 24000 or np.sqrt(np.mean(wav ** 2)) < 0.001:
                    raise RuntimeError(f"Không có tín hiệu giọng hợp lệ: {turn['cueId']}")
                # Retain natural breathing; only soften the outer 5 ms against clicks.
                fade = min(240, wav.size // 2)
                wav[:fade] *= np.linspace(0, 1, fade)
                wav[-fade:] *= np.linspace(1, 0, fade)
                with tempfile.TemporaryDirectory(prefix="audioverse-turn-") as tmp:
                    source = Path(tmp) / "source.wav"
                    sf.write(source, wav, 48000, subtype="FLOAT")
                    pending = cache / (key + ".pending.wav")
                    run(["ffmpeg", "-v", "error", "-y", "-i", str(source), "-af", f"atempo={turn['tempo']}", "-ar", "48000", "-ac", "1", str(pending)])
                    pending.replace(cached)
            wav, rate = sf.read(cached, dtype="float32")
            if rate != 48000 or wav.ndim != 1 or not np.isfinite(wav).all() or np.sqrt(np.mean(wav ** 2)) < 0.001:
                raise RuntimeError(f"Cache âm thanh không hợp lệ: {cached}")
            timeline.append({**turn, "startSeconds": offset / 48000, "durationSeconds": wav.size / 48000, "cacheSha256": hashlib.sha256(cached.read_bytes()).hexdigest()})
            gap = np.zeros(round(turn["pauseMs"] * 48), dtype=np.float32)
            chunks.extend([wav, gap])
            offset += wav.size + gap.size
        # Publish only after decoding and checking the completed MP3.
        with tempfile.TemporaryDirectory(prefix="audioverse-preview-") as tmp:
            source, encoded = Path(tmp) / "joined.wav", Path(tmp) / "preview.mp3"
            sf.write(source, np.concatenate(chunks), 48000, subtype="FLOAT")
            run(["ffmpeg", "-v", "error", "-y", "-i", str(source), "-af", profile["normalization"], "-ar", "48000", "-ac", "1", "-b:a", "128k", str(encoded)])
            pcm = np.frombuffer(run(["ffmpeg", "-v", "error", "-i", str(encoded), "-f", "f32le", "-ac", "1", "-ar", "48000", "pipe:1"]), dtype="<f4")
            rms, peak = float(np.sqrt(np.mean(pcm ** 2))), float(np.max(np.abs(pcm)))
            if not np.isfinite(pcm).all() or rms < 0.001 or peak >= 0.95 or abs(pcm.size - offset) > 4800:
                raise RuntimeError(f"Tệp MP3 không qua kiểm tra tín hiệu: {candidate['id']}")
            payload = encoded.read_bytes()
            filename = candidate["id"] + ".mp3"
            pending = OUT / (filename + ".pending")
            pending.write_bytes(payload)
            pending.replace(OUT / filename)
        transcript = "\n\n".join(f"{turn['speaker']}: {turn['text']}" for turn in candidate["turns"])
        (OUT / (candidate["id"] + ".txt")).write_text(transcript + "\n", encoding="utf-8")
        results.append({"id": candidate["id"], "narrator": candidate["narrator"], "file": filename, "bytes": len(payload), "audioSha256": hashlib.sha256(payload).hexdigest(), "durationSeconds": pcm.size / 48000, "rms": rms, "peak": peak, "turns": timeline})
        print(f"Đã tạo {filename}: {pcm.size / 48000:.1f} giây", flush=True)
    report = {
        "schemaVersion": 1, "status": "generated-awaiting-listening-review",
        "kind": "pre-generated-synthetic-speech", "storyId": plan["storyId"],
        "contentRevision": plan["contentRevision"], "sourceAttribution": plan["sourceAttribution"],
        "profile": profile, "networkConnectionsBlocked": True,
        "generationSeconds": round(time.monotonic() - started, 1), "candidates": results,
    }
    (OUT / "manifest.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    sections = []
    for candidate in results:
        transcript = "\n\n".join(f"{turn['speaker']}: {turn['text']}" for turn in candidate["turns"])
        name = html.escape(candidate["narrator"])
        sections.append(f'''<section aria-labelledby="{candidate['id']}">
<h2 id="{candidate['id']}">Giọng {name}</h2>
<p>Thời lượng {candidate['durationSeconds']:.0f} giây. Người kể: {name}; Thỏ: Xuân Vĩnh; Rùa: {name}.</p>
<audio controls preload="metadata" aria-label="Nghe thử giọng {name}" src="{candidate['file']}">Trình duyệt chưa hỗ trợ phát âm thanh.</audio>
<p><a href="{candidate['file']}" download>Tải bản MP3 giọng {name}</a></p>
<details><summary>Bản chữ cho giọng {name}</summary><p class="transcript">{html.escape(transcript)}</p></details>
</section>''')
    page = '''<!doctype html>
<html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Nghe thử giọng nam — AudioVerse Kids</title>
<style>
body{max-width:48rem;margin:auto;padding:1.25rem;font:1.125rem/1.65 system-ui,sans-serif;color:#183128;background:#fffdf5}
section{border-top:2px solid #416851;padding-block:1rem}audio{display:block;width:100%;min-height:54px}
a{color:#195837}a,summary{min-height:44px;display:inline-block;padding:.35rem}summary{display:list-item;cursor:pointer}
:focus-visible{outline:3px solid #183128;outline-offset:4px}.transcript{white-space:pre-line}
</style><main><h1>Nghe thử giọng nam kể chuyện</h1>
<p>Hai bản cùng trích đoạn “Rùa và Thỏ”, đi theo nhánh cuộc đua → lời xin lỗi. Bấm phát từng bản để so sánh; có thể tạm dừng bất cứ lúc nào.</p>
<p>Đây là giọng tổng hợp, đang chờ đánh giá bằng nghe. Cần đánh giá độ rõ lời, nhịp kể gần gũi, cách đọc lời xin lỗi và độ dễ phân biệt nhân vật.</p>
''' + "\n".join(sections) + "<p>" + html.escape(plan.get("sourceAttribution") or "") + '''</p></main>
<script>
const players = document.querySelectorAll('audio');
for (const active of players) {
  active.addEventListener('play', () => {
    for (const other of players) if (other !== active) other.pause();
  });
}
</script></html>\n'''
    (OUT / "index.html").write_text(page, encoding="utf-8")


if __name__ == "__main__":
    main()
