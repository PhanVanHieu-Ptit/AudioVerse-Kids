import { useState } from 'react';
import { AccessibleButton } from '@/design-system';
import { VoiceGuidanceButton } from '@/accessibility/VoiceGuidanceButton';
import { rhythmSound, sequenceSound } from '@/engines/audio/GameAudio';
import { rhythmBeat } from '@/content/gameSounds';
import type { GameAction } from '@/engines/game/GameEngine';
import type { GameChallenge, GameSession, GameSound } from '@/types/game';

interface Props {
  challenge: GameChallenge;
  session: GameSession;
  send: (action: GameAction) => void;
  play: (sound: GameSound) => void;
  stop: () => void;
  audioStatus: 'idle' | 'playing' | 'loading' | 'error';
}

export function ChallengeControls({
  challenge,
  session,
  send,
  play,
  stop,
  audioStatus,
}: Props) {
  const [showCardText, setShowCardText] = useState(false);
  const [rhythmMode, setRhythmMode] = useState<'tap' | 'select'>('tap');
  const [taps, setTaps] = useState<number[]>([]);
  const locked = session.phase !== 'playing';
  const busy = audioStatus === 'playing' || audioStatus === 'loading';
  const sound =
    challenge.mode === 'choice'
      ? challenge.sound
      : challenge.mode === 'sequence'
        ? sequenceSound(
            challenge.sequence.map((id) =>
              challenge.palette.find((s) => s.id === id)!,
            ),
          )
        : challenge.mode === 'rhythm'
          ? rhythmSound(challenge.intervals)
          : undefined;

  function inputActions(maximum: number, label: string) {
    return (
      <div className="game-input">
        <p aria-live="polite" aria-atomic="true">
          {label}:{' '}
          {session.input.length
            ? session.input
                .map((id) =>
                  challenge.mode === 'sequence'
                    ? challenge.palette.find((s) => s.id === id)?.label
                    : id === '1'
                      ? 'Ngắn'
                      : id === '2'
                        ? 'Dài'
                        : 'Rất dài',
                )
                .join(' → ')
            : 'Chưa chọn'}{' '}
          ({session.input.length}/{maximum})
        </p>
        <div className="activity-actions">
          <AccessibleButton
            variant="secondary"
            disabled={!session.input.length || locked}
            onClick={() => send({ type: 'undo' })}
          >
            Xóa nốt cuối
          </AccessibleButton>
          <AccessibleButton
            variant="secondary"
            disabled={!session.input.length || locked}
            onClick={() => send({ type: 'clear' })}
          >
            Nhập lại
          </AccessibleButton>
          <AccessibleButton
            disabled={session.input.length !== maximum || locked}
            onClick={() => {
              stop();
              send({ type: 'submit' });
            }}
          >
            {challenge.mode === 'rhythm'
              ? 'Kiểm tra khoảng nghỉ'
              : 'Kiểm tra chuỗi'}
          </AccessibleButton>
        </div>
      </div>
    );
  }

  return (
    <>
      {sound && (
        <div className="activity-actions">
          <AccessibleButton
            loading={audioStatus === 'loading'}
            loadingLabel="Đang mở âm thanh…"
            onClick={() => {
              setTaps([]);
              if (busy) stop();
              else play(sound);
            }}
          >
            {busy
              ? 'Dừng âm thanh'
              : challenge.mode === 'sequence'
                ? 'Nghe chuỗi âm thanh'
                : challenge.mode === 'rhythm'
                  ? 'Nghe mẫu nhịp'
                  : 'Nghe âm thanh'}
          </AccessibleButton>
        </div>
      )}
      {challenge.mode === 'choice' && !challenge.sound && (
        <VoiceGuidanceButton
          message={{
            id: challenge.id,
            text: challenge.prompt,
            ...(challenge.audioSrc ? { audioSrc: challenge.audioSrc } : {}),
          }}
          label="Nghe câu hỏi"
        />
      )}
      {challenge.mode !== 'pairs' && (
        <details>
          <summary>Mô tả thử thách bằng chữ</summary>
          <p>{challenge.description}</p>
        </details>
      )}
      {challenge.mode === 'choice' && (
        <fieldset className="pitch-options">
          <legend>Em chọn câu trả lời nào?</legend>
          <div className="game-options">
            {challenge.options.map((option) => (
              <AccessibleButton
                key={option.id}
                variant="secondary"
                disabled={locked}
                onClick={() => {
                  stop();
                  send({ type: 'answer', value: option.id });
                }}
              >
                {option.label}
              </AccessibleButton>
            ))}
          </div>
        </fieldset>
      )}
      {challenge.mode === 'sequence' && (
        <>
          <fieldset className="pitch-options">
            <legend>Chọn từng nốt theo thứ tự</legend>
            <div className="activity-actions">
              {challenge.palette.map((s) => (
                <AccessibleButton
                  key={s.id}
                  variant="secondary"
                  disabled={
                    locked || session.input.length >= challenge.sequence.length
                  }
                  onClick={() => {
                    send({ type: 'append', value: s.id });
                    play(s);
                  }}
                >
                  {s.label}
                </AccessibleButton>
              ))}
            </div>
          </fieldset>
          {inputActions(challenge.sequence.length, 'Chuỗi của em')}
        </>
      )}
      {challenge.mode === 'pairs' && (
        <>
          <AccessibleButton
            variant="secondary"
            aria-pressed={showCardText}
            onClick={() => setShowCardText(!showCardText)}
          >
            {showCardText ? 'Ẩn mô tả thẻ' : 'Bật mô tả thẻ bằng chữ'}
          </AccessibleButton>
          <p aria-live="polite">
            Đã tìm {session.matched.length / 2}/{challenge.cards.length / 2}{' '}
            cặp.
          </p>
          <div
            className="game-card-grid"
            role="group"
            aria-label="Các thẻ âm thanh"
          >
            {challenge.cards.map((card, index) => {
              const matched = session.matched.includes(card.id);
              const open = matched || session.input.includes(card.id);
              const blocked = locked || open || session.input.length === 2;
              return (
                <AccessibleButton
                  key={card.id}
                  variant="secondary"
                  className="game-sound-card"
                  aria-label={`Thẻ ${index + 1} · ${matched ? 'Đã ghép' : open ? 'Đang mở' : 'Chưa mở'}${open && showCardText ? ` · ${card.sound.label}: ${card.sound.description}` : ''}`}
                  aria-pressed={open}
                  disabled={blocked}
                  onClick={() => {
                    if (blocked) return;
                    play(card.sound);
                    send({ type: 'card', value: card.id });
                  }}
                >
                  <span>Thẻ {index + 1}</span>
                  <span>
                    {matched ? 'Đã ghép' : open ? 'Đang mở' : 'Chưa mở'}
                  </span>
                  {open && showCardText && (
                    <span>
                      {card.sound.label}: {card.sound.description}
                    </span>
                  )}
                </AccessibleButton>
              );
            })}
          </div>
          <AccessibleButton
            variant="secondary"
            disabled={session.input.length !== 2 || locked}
            onClick={() => {
              stop();
              send({ type: 'hide' });
            }}
          >
            Úp hai thẻ
          </AccessibleButton>
        </>
      )}
      {challenge.mode === 'rhythm' && (
        <>
          <div
            className="activity-actions"
            role="group"
            aria-label="Cách trả lời nhịp điệu"
          >
            <AccessibleButton
              variant="secondary"
              aria-pressed={rhythmMode === 'tap'}
              disabled={locked}
              onClick={() => {
                setRhythmMode('tap');
                setTaps([]);
              }}
            >
              Gõ theo nhịp
            </AccessibleButton>
            <AccessibleButton
              variant="secondary"
              aria-pressed={rhythmMode === 'select'}
              disabled={locked}
              onClick={() => {
                stop();
                setRhythmMode('select');
                setTaps([]);
              }}
            >
              Chọn khoảng nghỉ
            </AccessibleButton>
          </div>
          {rhythmMode === 'tap' ? (
            <>
              <p id="tap-help">
                Đến nút Gõ nhịp bằng Tab, dùng Enter hoặc Space để gõ{' '}
                {challenge.intervals.length + 1} tiếng. Em có thể gõ chậm hơn
                mẫu. Chọn khoảng nghỉ nếu muốn trả lời không theo thời gian.
              </p>
              <p aria-live="polite" aria-atomic="true">
                Đã gõ {taps.length}/{challenge.intervals.length + 1} tiếng.
              </p>
              <AccessibleButton
                size="large"
                aria-describedby="tap-help"
                disabled={
                  locked || taps.length >= challenge.intervals.length + 1
                }
                onKeyDown={(event) => {
                  if (event.repeat) event.preventDefault();
                }}
                onClick={() => {
                  const timestamp = performance.now();
                  play(rhythmBeat);
                  setTaps((previous) => [...previous, timestamp]);
                }}
              >
                Gõ nhịp
              </AccessibleButton>
              <div className="activity-actions">
                <AccessibleButton
                  variant="secondary"
                  disabled={locked || !taps.length}
                  onClick={() => {
                    stop();
                    setTaps([]);
                  }}
                >
                  Gõ lại
                </AccessibleButton>
                <AccessibleButton
                  disabled={
                    locked || taps.length !== challenge.intervals.length + 1
                  }
                  onClick={() => {
                    stop();
                    send({ type: 'rhythm', timestamps: taps });
                  }}
                >
                  Kiểm tra nhịp
                </AccessibleButton>
              </div>
            </>
          ) : (
            <>
              <p>
                Tiếng gõ đầu tiên có sẵn. Chọn lần lượt khoảng nghỉ giữa các
                tiếng: ngắn = 1, dài = 2, rất dài = 3 đơn vị.
              </p>
              <div className="activity-actions">
                {[
                  { value: '1', label: 'Ngắn' },
                  { value: '2', label: 'Dài' },
                  { value: '3', label: 'Rất dài' },
                ].map((option) => (
                  <AccessibleButton
                    key={option.value}
                    variant="secondary"
                    disabled={
                      locked ||
                      session.input.length >= challenge.intervals.length
                    }
                    onClick={() =>
                      send({ type: 'append', value: option.value })
                    }
                  >
                    {option.label}
                  </AccessibleButton>
                ))}
              </div>
              {inputActions(challenge.intervals.length, 'Khoảng nghỉ của em')}
            </>
          )}
        </>
      )}
    </>
  );
}
