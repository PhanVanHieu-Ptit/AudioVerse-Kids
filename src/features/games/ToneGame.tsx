import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useStore } from 'zustand';
import { AccessibleButton, EmptyState, LoadingState } from '@/design-system';
import {
  pitchOptions,
  type Pitch,
  type ToneGameDefinition,
} from '@/content/games';
import { answerToneRound } from '@/engines/game/toneGame';
import { useTonePreview } from '@/hooks/useTonePreview';
import { activityStore } from '@/stores/activityStore';
import { activityKey } from '@/types/activity';
import { ProgressNotice } from './ProgressNotice';

export function ToneGame({ game }: { game: ToneGameDefinition }) {
  const { pathname } = useLocation();
  const status = useStore(activityStore, (state) => state.status);
  const progress = useStore(
    activityStore,
    (state) => state.records[activityKey('game', game.id)],
  );
  const active = useStore(
    activityStore,
    (state) => state.activePath === pathname,
  );
  const [feedback, setFeedback] = useState('');
  const question = useRef<HTMLHeadingElement>(null);
  const wasActive = useRef(false);
  const position = Math.min(progress?.position ?? 0, game.rounds.length);
  const round = game.rounds[position];
  const completed = position === game.rounds.length;
  const audio = useTonePreview({
    frequency: round?.frequency ?? 440,
    durationSeconds: game.durationSeconds,
    gain: game.gain,
  });

  useEffect(() => {
    if (active || wasActive.current) question.current?.focus();
    wasActive.current = active;
  }, [active, position, completed]);

  if (status === 'loading')
    return <LoadingState label="Đang mở tiến độ trên thiết bị…" />;

  async function save(nextPosition: number) {
    await activityStore.getState().save({
      kind: 'game',
      id: game.id,
      position: nextPosition,
      completed: nextPosition === game.rounds.length,
    });
  }

  function start() {
    activityStore.getState().activate(pathname);
    setFeedback('');
    void save(position);
  }

  function answer(value: Pitch) {
    const result = answerToneRound(game, position, value);
    if (!result.correct) {
      setFeedback(
        'Chưa đúng rồi. Em hãy nghe lại hoặc đọc mô tả và thử tiếp nhé.',
      );
      return;
    }
    audio.stop();
    setFeedback(
      result.position === game.rounds.length
        ? 'Em đã nhận biết đủ ba nốt nhạc!'
        : 'Đúng rồi! Cùng khám phá nốt tiếp theo.',
    );
    void save(result.position).then(() => {
      if (result.position === game.rounds.length)
        activityStore.getState().deactivate();
    });
  }

  return (
    <div className="activity-panel">
      <p>{game.instructions}</p>
      <ProgressNotice />
      {completed ? (
        <>
          <h2 ref={question} tabIndex={-1}>
            Em đã hoàn thành!
          </h2>
          <p>
            Em đã khám phá {game.rounds.length} nốt nhạc. Hãy nghỉ một chút hoặc
            chọn hoạt động khác nhé.
          </p>
          <AccessibleButton
            onClick={() => {
              setFeedback('');
              void save(0);
            }}
          >
            Chơi lại từ đầu
          </AccessibleButton>
        </>
      ) : !active ? (
        <>
          <h2>Sẵn sàng lắng nghe</h2>
          {progress && (
            <p>
              Đã khám phá {position} trên {game.rounds.length} nốt nhạc.
            </p>
          )}
          <AccessibleButton onClick={start}>
            {progress ? 'Tiếp tục trò chơi' : 'Bắt đầu trò chơi'}
          </AccessibleButton>
        </>
      ) : round ? (
        <>
          <h2 ref={question} tabIndex={-1}>
            Nốt nhạc {position + 1} trên {game.rounds.length}
          </h2>
          <AccessibleButton
            loading={audio.state === 'loading'}
            loadingLabel="Đang mở âm thanh…"
            onClick={() => void audio.activate()}
          >
            {audio.state === 'playing' ? 'Dừng nốt nhạc' : 'Nghe nốt nhạc'}
          </AccessibleButton>
          {audio.state === 'error' && (
            <p role="alert">
              Chưa phát được âm thanh. Em có thể thử nghe lại hoặc dùng mô tả
              bằng chữ bên dưới.
            </p>
          )}
          <details key={position}>
            <summary>Mô tả nốt nhạc bằng chữ</summary>
            <p>{round.description}</p>
          </details>
          <fieldset className="pitch-options">
            <legend>Em nghe thấy âm gì?</legend>
            <div className="activity-actions">
              {pitchOptions.map((option) => (
                <AccessibleButton
                  key={option.value}
                  variant="secondary"
                  onClick={() => answer(option.value)}
                >
                  {option.label}
                </AccessibleButton>
              ))}
            </div>
          </fieldset>
        </>
      ) : (
        <EmptyState
          title="Chưa có nốt nhạc"
          description="Em hãy quay về danh sách và chọn trò chơi khác."
        />
      )}
      <p role="status" aria-atomic="true">
        {feedback}
      </p>
      <Link className="text-link" to="/games">
        Về danh sách trò chơi
      </Link>
    </div>
  );
}
