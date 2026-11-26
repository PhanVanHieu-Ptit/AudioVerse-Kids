import { useRef } from 'react';
import { AccessibleButton } from '@/components/atoms/AccessibleButton';
import {
  InstrumentLibrary,
  musicNotes,
  type Beats,
  type InstrumentId,
  type MusicStep,
  type NoteId,
} from '@/engines/music/InstrumentLibrary';

export function SequenceEditor({
  steps,
  onChange,
}: {
  steps: MusicStep[];
  onChange: (steps: MusicStep[]) => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  function update(index: number, patch: Partial<MusicStep>) {
    onChange(
      steps.map((step, i) => (i === index ? { ...step, ...patch } : step)),
    );
  }
  function move(index: number, offset: number) {
    const next = [...steps];
    [next[index], next[index + offset]] = [next[index + offset]!, next[index]!];
    onChange(next);
  }
  return (
    <div className="music-sequence">
      <h3 ref={heading} tabIndex={-1}>
        Chuỗi của em: {steps.length} trên 64 bước
      </h3>
      {!steps.length && (
        <p>Chọn một nốt ở khu vực chơi nhạc để bắt đầu sáng tác.</p>
      )}
      <ol className="music-step-list" aria-label="Các bước trong bản nhạc">
        {steps.map((step, index) => (
          <li key={index}>
            <fieldset>
              <legend>Bước {index + 1}</legend>
              <div className="music-step-fields">
                <label>
                  Nốt ở bước {index + 1}
                  <select
                    value={step.note ?? 'rest'}
                    onChange={(e) =>
                      update(index, {
                        note:
                          e.target.value === 'rest'
                            ? null
                            : (e.target.value as NoteId),
                      })
                    }
                  >
                    <option value="rest">Nghỉ</option>
                    {musicNotes.map((note) => (
                      <option key={note.id} value={note.id}>
                        {note.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Nhạc cụ ở bước {index + 1}
                  <select
                    value={step.instrument}
                    onChange={(e) =>
                      update(index, {
                        instrument: e.target.value as InstrumentId,
                      })
                    }
                  >
                    {InstrumentLibrary.map((instrument) => (
                      <option key={instrument.id} value={instrument.id}>
                        {instrument.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Độ dài bước {index + 1}
                  <select
                    value={step.beats}
                    onChange={(e) =>
                      update(index, { beats: Number(e.target.value) as Beats })
                    }
                  >
                    <option value={0.5}>Nửa phách</option>
                    <option value={1}>Một phách</option>
                    <option value={2}>Hai phách</option>
                  </select>
                </label>
              </div>
              <div className="music-actions">
                <AccessibleButton
                  variant="secondary"
                  disabled={index === 0}
                  aria-label={`Đưa bước ${index + 1} lên trước`}
                  onClick={() => move(index, -1)}
                >
                  Lên trước
                </AccessibleButton>
                <AccessibleButton
                  variant="secondary"
                  disabled={index === steps.length - 1}
                  aria-label={`Đưa bước ${index + 1} ra sau`}
                  onClick={() => move(index, 1)}
                >
                  Ra sau
                </AccessibleButton>
                <AccessibleButton
                  variant="danger"
                  aria-label={`Xóa bước ${index + 1}`}
                  onClick={() => {
                    onChange(steps.filter((_, i) => i !== index));
                    heading.current?.focus();
                  }}
                >
                  Xóa bước
                </AccessibleButton>
              </div>
            </fieldset>
          </li>
        ))}
      </ol>
    </div>
  );
}
