"""Offline neural speech production. Files are staged; TypeScript publishes them."""

import hashlib
import importlib.metadata
import json
import os
from pathlib import Path
import shutil
import socket
import subprocess
import sys
import tempfile
import time

ROOT = Path(__file__).resolve().parents[2]
CACHE = ROOT / ".cache/local-tts"


def digest(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def deny_connection(*_args: object, **_kwargs: object) -> None:
    raise RuntimeError("Tạo giọng cục bộ: không cho phép kết nối mạng.")


def run(args: list[str]) -> bytes:
    result = subprocess.run(args, capture_output=True)
    if result.returncode:
        raise RuntimeError(f"{args[0]}: {result.stderr.decode(errors='replace')[-1500:]}")
    return result.stdout


def atomic_json(path: Path, data: object) -> None:
    pending = path.with_suffix(path.suffix + ".pending")
    pending.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    pending.replace(path)


def configure_local_runtime(profile: dict) -> None:
    for executable in ("ffmpeg", "ffprobe"):
        if not shutil.which(executable):
            raise RuntimeError(f"Cần {executable} trong PATH.")
    if importlib.metadata.version("vieneu") != profile["sdkVersion"]:
        raise RuntimeError(f"Cần vieneu=={profile['sdkVersion']}; xem scripts/local-tts/README.md.")
    for repo, revision in profile["modelRevisions"].items():
        model = CACHE / "huggingface/hub" / ("models--" + repo.replace("/", "--"))
        if (model / "refs/main").read_text().strip() != revision or not (model / "snapshots" / revision).is_dir():
            raise RuntimeError(f"Cache chưa có đúng phiên bản {repo}@{revision}.")
    os.environ.update({
        "HF_HOME": str(CACHE / "huggingface"),
        "HF_HUB_OFFLINE": "1", "TRANSFORMERS_OFFLINE": "1",
        "HF_HUB_DISABLE_TELEMETRY": "1", "DO_NOT_TRACK": "1",
    })
    socket.socket.connect = deny_connection
    socket.socket.connect_ex = deny_connection
    socket.create_connection = deny_connection


def main() -> None:
    plan_file = Path(sys.argv[1]).resolve()
    plan = json.loads(plan_file.read_text(encoding="utf-8"))
    profile = plan["profile"]
    configure_local_runtime(profile)
    import numpy as np
    import soundfile as sf
    import onnxruntime as ort
    from vieneu import Vieneu

    ort.disable_telemetry_events()

    staging = plan_file.parent
    turns_cache = CACHE / "library-turns"
    turns_cache.mkdir(parents=True, exist_ok=True)
    source_rate = profile["sourceSampleRate"]
    if source_rate != 48000:
        raise RuntimeError("VieNeu v3 Turbo yêu cầu nguồn 48 kHz.")
    engine = Vieneu(mode="v3turbo", backend=profile["backend"], device="cpu", precision=profile["precision"], threads=4)
    voices = {turn["voice"] for item in plan["recordings"] for turn in item["turns"]}
    for voice in voices:
        if engine.resolve_voice_name(voice) is None:
            raise RuntimeError(f"Không có preset giọng {voice}.")
    started = time.monotonic()
    generated = 0

    def waveform(turn: dict):
        nonlocal generated
        # Reuse identical speech across separate questions, repeated messages and scenes.
        settings = {key: profile[key] for key in ("sdkVersion", "modelRevisions", "backend", "precision", "temperature", "seed", "sourceSampleRate", "applyWatermark")}
        key = digest(json.dumps({"settings": settings, "text": turn["text"], "voice": turn["voice"], "tempo": turn["tempo"], "revision": 1}, sort_keys=True, ensure_ascii=False).encode())
        target = turns_cache / (key + ".wav")
        metadata = target.with_suffix(".json")
        if target.is_file() and metadata.is_file():
            cached = json.loads(metadata.read_text())
            if digest(target.read_bytes()) == cached.get("sha256"):
                wav, rate = sf.read(target, dtype="float32")
                if rate == source_rate and wav.ndim == 1 and np.isfinite(wav).all() and np.sqrt(np.mean(wav ** 2)) > 0.001:
                    return wav
        # Reject obviously incomplete/babbling speech and retry with a recorded seed.
        syllables = len(turn["text"].split())
        used_seed = profile["seed"]
        for attempt in range(3):
            used_seed = profile["seed"] + attempt
            np.random.seed(used_seed)
            wav = np.asarray(engine.infer(text=turn["text"], voice=turn["voice"], temperature=profile["temperature"], apply_watermark=profile["applyWatermark"]), dtype=np.float32)
            duration = wav.size / source_rate
            if wav.ndim == 1 and np.isfinite(wav).all() and max(0.35, syllables / 12) <= duration <= max(4, syllables / 1.8 + 2) and np.sqrt(np.mean(wav ** 2)) > 0.001:
                break
            print(f"Sinh lại lời {turn['cueId']} (lần {attempt + 1})", flush=True)
        else:
            raise RuntimeError(f"Không tạo được tín hiệu hợp lệ: {turn['cueId']}")
        fade = min(240, wav.size // 2)
        wav[:fade] *= np.linspace(0, 1, fade)
        wav[-fade:] *= np.linspace(1, 0, fade)
        with tempfile.TemporaryDirectory(prefix="audioverse-neural-turn-") as tmp:
            source = Path(tmp) / "source.wav"
            sf.write(source, wav, source_rate, subtype="FLOAT")
            pending = turns_cache / (key + ".pending.wav")
            run(["ffmpeg", "-v", "error", "-y", "-i", str(source), "-af", f"atempo={turn['tempo']}", "-ar", str(source_rate), "-ac", "1", str(pending)])
            pending.replace(target)
        atomic_json(metadata, {"sha256": digest(target.read_bytes()), "seed": used_seed, "cueId": turn["cueId"]})
        generated += 1
        wav, _ = sf.read(target, dtype="float32")
        return wav

    report = []
    for index, item in enumerate(plan["recordings"]):
        target = staging / "files" / item["file"]
        target.parent.mkdir(parents=True, exist_ok=True)
        metadata = target.with_suffix(".json")
        if target.is_file() and metadata.is_file():
            cached = json.loads(metadata.read_text())
            payload = target.read_bytes()
            if cached.get("profileHash") == item["profileHash"] and cached.get("bytes") == len(payload) and cached.get("audioSha256") == digest(payload):
                report.append(cached)
                print(f"Đã kiểm tra {index + 1}/{len(plan['recordings'])}: {item['id']} (cache)", flush=True)
                continue
        chunks, timeline, offset = [], [], 0
        for turn in item["turns"]:
            wav = waveform(turn)
            timeline.append({"cueId": turn["cueId"], "voice": turn["voice"], "startSeconds": offset / source_rate, "durationSeconds": wav.size / source_rate, "pauseMs": turn["pauseMs"]})
            gap = np.zeros(round(turn["pauseMs"] * source_rate / 1000), dtype=np.float32)
            chunks.extend([wav, gap])
            offset += wav.size + gap.size
        with tempfile.TemporaryDirectory(prefix="audioverse-neural-scene-") as tmp:
            source, encoded = Path(tmp) / "joined.wav", Path(tmp) / "reading.mp3"
            sf.write(source, np.concatenate(chunks), source_rate, subtype="FLOAT")
            run(["ffmpeg", "-v", "error", "-y", "-i", str(source), "-af", profile["normalization"], "-ar", str(profile["sampleRate"]), "-ac", "1", "-b:a", profile["bitRate"], "-map_metadata", "-1", str(encoded)])
            pcm = np.frombuffer(run(["ffmpeg", "-v", "error", "-i", str(encoded), "-f", "f32le", "-ac", "1", "-ar", str(profile["sampleRate"]), "pipe:1"]), dtype="<f4")
            rms, peak = float(np.sqrt(np.mean(pcm ** 2))), float(np.max(np.abs(pcm)))
            duration = float(run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", str(encoded)]).decode().strip())
            if not np.isfinite(pcm).all() or rms < 0.001 or peak >= 0.95 or abs(pcm.size / profile["sampleRate"] - offset / source_rate) > 0.15 or duration < 0.5:
                raise RuntimeError(f"MP3 không hợp lệ: {item['id']}")
            payload = encoded.read_bytes()
            pending = target.with_suffix(".pending.mp3")
            pending.write_bytes(payload)
            pending.replace(target)
        result = {"id": item["id"], "profileHash": item["profileHash"], "audioSha256": digest(payload), "bytes": len(payload), "durationSeconds": duration, "rms": rms, "peak": peak, "timeline": timeline}
        atomic_json(metadata, result)
        report.append(result)
        print(f"Đã tạo {index + 1}/{len(plan['recordings'])}: {item['id']} — {duration:.1f}s; {generated} lời mới; {time.monotonic() - started:.0f}s", flush=True)
    atomic_json(staging / "report.json", report)


if __name__ == "__main__":
    main()
