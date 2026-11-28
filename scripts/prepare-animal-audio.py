"""Rebuild bundled animal recordings from the pinned CC0/public-domain sources.

Requires Python 3 and FFmpeg. Downloads only with --download; source files are
cached outside the shipped bundle. Runtime playback never contacts these hosts.
"""

import argparse
import array
import hashlib
import json
import math
from pathlib import Path
import subprocess
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / ".cache/animal-audio"
OUTPUT = ROOT / "public/audio/animals"
TARGET = "loudnorm=I=-18:TP=-2:LRA=7"


def run(args):
    return subprocess.check_output(args)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--download", action="store_true")
    args = parser.parse_args()
    manifest = json.loads((OUTPUT / "sources.json").read_text())
    CACHE.mkdir(parents=True, exist_ok=True)
    for item in manifest["assets"]:
        source = CACHE / (item["id"] + Path(item["downloadUrl"]).suffix)
        if not source.exists():
            if not args.download:
                raise RuntimeError(f"Missing {source}; use --download to fetch sources")
            request = urllib.request.Request(item["downloadUrl"], headers={"User-Agent": "AudioVerseKids/1.0"})
            source.write_bytes(urllib.request.urlopen(request, timeout=30).read())
        if hashlib.sha256(source.read_bytes()).hexdigest() != item["sourceSha256"]:
            raise RuntimeError(f"Source checksum mismatch: {item['id']}")
        duration = item["endSeconds"] - item["startSeconds"]
        filters = f"atrim=start={item['startSeconds']}:end={item['endSeconds']},asetpts=PTS-STARTPTS,highpass=f=60,afade=t=in:d=0.01,afade=t=out:st={duration - 0.04}:d=0.04"
        if item.get("repeat", 1) > 1:
            filters += f",apad=pad_dur=0.35,aresample=44100,aloop=loop={item['repeat'] - 1}:size={round((duration + 0.35) * 44100)}"
        # Measure first, then normalize with fixed gain to preserve natural calls.
        stats = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(source), "-af", filters + "," + TARGET + ":print_format=json", "-f", "null", "-"], capture_output=True, check=True).stderr.decode()
        measure = json.JSONDecoder().raw_decode(stats[stats.rindex("{"):])[0]
        normalization = TARGET + ":linear=true:" + ":".join([
            f"measured_I={measure['input_i']}", f"measured_TP={measure['input_tp']}",
            f"measured_LRA={measure['input_lra']}", f"measured_thresh={measure['input_thresh']}",
            f"offset={measure['target_offset']}",
        ])
        target = OUTPUT / item["file"]
        run(["ffmpeg", "-v", "error", "-y", "-i", str(source), "-af", filters + "," + normalization, "-ac", "1", "-ar", "44100", "-b:a", "128k", "-map_metadata", "-1", str(target)])
        pcm = array.array("f", run(["ffmpeg", "-v", "error", "-i", str(target), "-ac", "1", "-ar", "44100", "-f", "f32le", "-"]))
        peak = max(abs(value) for value in pcm)
        rms = math.sqrt(sum(value * value for value in pcm) / len(pcm))
        if not 0.03 <= rms <= 0.3 or peak >= 0.9:
            raise RuntimeError(f"Unexpected output level: {item['id']}: RMS {rms}, peak {peak}")
        data = target.read_bytes()
        item.update(bytes=len(data), sha256=hashlib.sha256(data).hexdigest(), durationSeconds=len(pcm) / 44100, rms=rms, peak=peak)
        print(f"{item['id']}: {len(pcm) / 44100:.2f}s, RMS {rms:.3f}, peak {peak:.3f}")
    (OUTPUT / "sources.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")


if __name__ == "__main__":
    main()
