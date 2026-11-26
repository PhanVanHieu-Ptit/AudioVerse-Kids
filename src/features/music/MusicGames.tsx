import { useState } from 'react';
import { AccessibleButton } from '@/components/atoms/AccessibleButton';
import { VoiceGuidanceButton } from '@/accessibility/VoiceGuidanceButton';
import { musicVoiceMessages } from '@/content/musicVoiceMessages';
import type { VoiceMessage } from '@/engines/audio/voiceTypes';
import { musicNotes, type NoteId } from '@/engines/music/InstrumentLibrary';
import {
  createMelody,
  matchesMelody,
  melodySteps,
  rhythmPatterns,
  rhythmSteps,
} from '@/engines/music/musicGames';
import type { useMusicEngine } from '@/hooks/useMusicEngine';

export function MusicGames({
  audio,
}: {
  audio: ReturnType<typeof useMusicEngine>;
}) {
  const [mode, setMode] = useState<'melody' | 'rhythm'>('melody');
  const [melody, setMelody] = useState<NoteId[]>(() => createMelody());
  const [rhythm, setRhythm] = useState(() =>
    Math.floor(Math.random() * rhythmPatterns.length),
  );
  const [answer, setAnswer] = useState<NoteId[]>([]);
  const [heard, setHeard] = useState(false);
  const [feedback, setFeedback] = useState<VoiceMessage>(
    musicVoiceMessages.ready,
  );
  const [attempted, setAttempted] = useState(false);
  const busy = audio.status === 'loading' || audio.status === 'playing';
  const instructions = musicVoiceMessages[mode];

  function reset(nextMode = mode) {
    audio.stop();
    setMode(nextMode);
    setMelody(createMelody());
    setRhythm(Math.floor(Math.random() * rhythmPatterns.length));
    setAnswer([]);
    setHeard(false);
    setAttempted(false);
    setFeedback(musicVoiceMessages.ready);
  }

  function listen() {
    setAnswer([]);
    setAttempted(false);
    setHeard(false);
    setFeedback(musicVoiceMessages.listening);
    void audio.play(
      mode === 'melody' ? melodySteps(melody) : rhythmSteps(rhythm),
      100,
      () => {
        setHeard(true);
        setFeedback(
          mode === 'melody'
            ? musicVoiceMessages.melodyReady
            : musicVoiceMessages.rhythmReady,
        );
      },
    );
  }

  function chooseNote(note: NoteId) {
    if (!heard || busy || attempted) return;
    const next = [...answer, note];
    setAnswer(next);
    if (next.length === melody.length) {
      setAttempted(true);
      setFeedback(
        matchesMelody(melody, next)
          ? musicVoiceMessages.melodyCorrect
          : musicVoiceMessages.melodyIncorrect,
      );
    } else
      setFeedback(
        next.length === 1
          ? musicVoiceMessages.pickedOne
          : musicVoiceMessages.pickedTwo,
      );
  }

  return (
    <section className="music-panel" aria-labelledby="music-games-title">
      <h2 id="music-games-title">4. Chơi cùng âm nhạc</h2>
      <fieldset>
        <legend>Chọn trò chơi</legend>
        <div className="music-actions">
          <AccessibleButton
            variant="secondary"
            aria-pressed={mode === 'melody'}
            onClick={() => reset('melody')}
          >
            Ghi nhớ giai điệu
          </AccessibleButton>
          <AccessibleButton
            variant="secondary"
            aria-pressed={mode === 'rhythm'}
            onClick={() => reset('rhythm')}
          >
            Nhận diện nhịp điệu
          </AccessibleButton>
        </div>
      </fieldset>
      <p>{instructions.text}</p>
      <VoiceGuidanceButton
        label="Nghe hướng dẫn trò chơi"
        message={instructions}
      />
      <div className="music-actions">
        <AccessibleButton onClick={listen}>Nghe đề bài</AccessibleButton>
        <AccessibleButton variant="secondary" onClick={() => reset()}>
          Câu mới
        </AccessibleButton>
      </div>
      {mode === 'melody' ? (
        <>
          <fieldset disabled={!heard || busy}>
            <legend>Chọn lại các nốt đã nghe</legend>
            <div className="music-note-grid">
              {musicNotes.slice(0, 5).map((note) => (
                <AccessibleButton
                  key={note.id}
                  variant="secondary"
                  aria-disabled={attempted || undefined}
                  onClick={() => chooseNote(note.id)}
                >
                  {note.label}
                </AccessibleButton>
              ))}
            </div>
          </fieldset>
          <p>
            Câu trả lời:{' '}
            {answer.length
              ? answer
                  .map((id) => musicNotes.find((note) => note.id === id)?.label)
                  .join(', ')
              : 'chưa chọn nốt nào'}
            .
          </p>
          <AccessibleButton
            variant="secondary"
            disabled={!answer.length || busy}
            onClick={() => {
              setAnswer(answer.slice(0, -1));
              setAttempted(false);
              setFeedback(musicVoiceMessages.cleared);
            }}
          >
            Sửa nốt cuối
          </AccessibleButton>
          <details>
            <summary>Gợi ý bằng chữ cho giai điệu</summary>
            <p>
              {melody
                .map((id) => musicNotes.find((note) => note.id === id)?.label)
                .join(', ')}
            </p>
          </details>
        </>
      ) : (
        <fieldset disabled={!heard}>
          <legend>Nghe và chọn nhịp giống đề bài</legend>
          <div className="music-rhythm-options">
            {rhythmPatterns.map((pattern, index) => (
              <div key={pattern.id} className="music-rhythm-option">
                <h3>Nhịp {index + 1}</h3>
                <AccessibleButton
                  variant="secondary"
                  onClick={() => void audio.play(rhythmSteps(index))}
                >
                  Nghe nhịp {index + 1}
                </AccessibleButton>
                <AccessibleButton
                  disabled={busy}
                  onClick={() => {
                    setFeedback(
                      index === rhythm
                        ? musicVoiceMessages.rhythmCorrect
                        : musicVoiceMessages.rhythmIncorrect,
                    );
                  }}
                >
                  Chọn nhịp {index + 1}
                </AccessibleButton>
                <details>
                  <summary>Mô tả nhịp {index + 1}</summary>
                  <p>{pattern.description}</p>
                </details>
              </div>
            ))}
          </div>
        </fieldset>
      )}
      <p role="status" aria-label="Kết quả trò chơi âm nhạc" aria-atomic="true">
        {feedback.text}
      </p>
      <VoiceGuidanceButton
        label="Nghe trạng thái trò chơi"
        message={feedback}
      />
    </section>
  );
}
