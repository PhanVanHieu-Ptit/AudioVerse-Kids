import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useStore } from 'zustand';
import { AccessibleButton, LoadingState } from '@/design-system';
import { activityStore } from '@/stores/activityStore';
import { preferencesStore } from '@/stores/preferencesStore';
import { activityKey } from '@/types/activity';
import type {
  ActivityGameDefinition,
  GameLevel,
  GameProgress,
} from '@/types/game';
import {
  createSession,
  levelChallenges,
  progressSummary,
  restoreGame,
  transitionGame,
  type GameAction,
} from '@/engines/game/GameEngine';
import { useGameAudio } from '@/hooks/useGameAudio';
import { voiceGuidance } from '@/engines/audio/VoiceGuidance';
import { announce, clearAnnouncement } from '@/accessibility/announcements';
import { VoiceGuidanceButton } from '@/accessibility/VoiceGuidanceButton';
import { activityVoiceMessage } from '@/content/voiceMessages';
import { gameLevels } from '@/content/activityGames';
import { gameVoiceMessages } from '@/content/gameVoiceMessages';
import { ProgressNotice } from './ProgressNotice';
import { ChallengeControls } from './ChallengeControls';
import './games.css';

export function ActivityGame({ game }: { game: ActivityGameDefinition }) {
  const status = useStore(activityStore, (state) => state.status);
  const record = useStore(
    activityStore,
    (state) => state.records[activityKey('game', game.id)],
  );
  if (status === 'loading')
    return <LoadingState label="Đang mở tiến độ trên thiết bị…" />;
  return <GamePlayer game={game} initial={record?.game} />;
}

function GamePlayer({
  game,
  initial,
}: {
  game: ActivityGameDefinition;
  initial: unknown;
}) {
  const { pathname } = useLocation();
  const active = useStore(
    activityStore,
    (state) => state.activePath === pathname,
  );
  const voiceEnabled = useStore(
    preferencesStore,
    (state) => state.preferences.voiceGuidance,
  );
  const [progress, setProgress] = useState(() => restoreGame(game, initial));
  const latest = useRef(progress);
  const title = useRef<HTMLHeadingElement>(null);
  const wasActive = useRef(false);
  const audio = useGameAudio();
  const level = progress.selectedLevel;
  const challenges = levelChallenges(game, level);
  const session = progress.levels[level] ?? createSession();
  const challenge = challenges[session.round];
  const completed = session.phase === 'completed';
  const solved = session.round + (session.phase === 'feedback' ? 1 : 0);
  const feedback =
    session.feedback === 'incorrect'
      ? challenge?.mode === 'pairs'
        ? 'Hai âm thanh chưa khớp. Hãy úp hai thẻ và thử lại nhé.'
        : 'Chưa đúng rồi. Em có thể nghe lại, đọc mô tả và thử tiếp nhé.'
      : session.feedback === 'correct'
        ? session.phase === 'feedback'
          ? `Đúng rồi! ${challenge?.explanation ?? ''}`
          : 'Đúng rồi! Em đã tìm thấy một cặp.'
        : '';

  useEffect(() => clearAnnouncement, []);
  useEffect(() => {
    if (active || wasActive.current) title.current?.focus();
    wasActive.current = active;
  }, [active, session.round, session.phase]);

  function commit(next: GameProgress) {
    latest.current = next;
    setProgress(next);
    void activityStore.getState().save({
      kind: 'game',
      id: game.id,
      ...progressSummary(next),
      game: next,
    });
  }

  function send(action: GameAction) {
    voiceGuidance.stop();
    const current = latest.current;
    const selected = current.selectedLevel;
    const before = current.levels[selected] ?? createSession();
    const after = transitionGame(
      before,
      levelChallenges(game, selected),
      action,
    );
    if (before === after) return;
    commit({ ...current, levels: { ...current.levels, [selected]: after } });
    if (after.feedback === 'incorrect')
      announce('Chưa đúng. Hãy nghe lại hoặc đọc mô tả và thử tiếp.');
    if (after.feedback === 'correct')
      announce(
        after.phase === 'feedback'
          ? `Đúng rồi! ${levelChallenges(game, selected)[after.round]?.explanation ?? ''}`
          : 'Đã tìm thấy một cặp.',
      );
    if (after.phase === 'completed') {
      audio.stop();
      activityStore.getState().deactivate();
      announce(
        `Em đã hoàn thành cấp độ ${selected}. Đúng ngay lần đầu ${after.firstTry} trên ${challenges.length} thử thách.`,
      );
    }
  }

  function chooseLevel(value: GameLevel) {
    voiceGuidance.stop();
    audio.stop();
    commit({ ...latest.current, selectedLevel: value });
  }

  function start(replay = false) {
    voiceGuidance.stop();
    audio.stop();
    const current = latest.current;
    commit({
      ...current,
      levels: {
        ...current.levels,
        [level]: replay
          ? createSession()
          : (current.levels[level] ?? createSession()),
      },
    });
    activityStore.getState().activate(pathname);
  }

  return (
    <section className="activity-panel game-player" aria-label={game.title}>
      {active ? (
        <details>
          <summary>Xem lại hướng dẫn</summary>
          <p>{game.instructions}</p>
        </details>
      ) : (
        <p>{game.instructions}</p>
      )}
      {voiceEnabled ? (
        <VoiceGuidanceButton message={activityVoiceMessage(game)} />
      ) : (
        <AccessibleButton
          variant="secondary"
          onClick={() =>
            void preferencesStore
              .getState()
              .updatePreference('voiceGuidance', true)
          }
        >
          Bật hướng dẫn giọng nói
        </AccessibleButton>
      )}
      <ProgressNotice />
      {!active && (
        <fieldset className="pitch-options">
          <legend>Chọn cấp độ</legend>
          <div className="activity-actions">
            {gameLevels.map((item) => (
              <AccessibleButton
                key={item.value}
                variant="secondary"
                aria-pressed={level === item.value}
                onClick={() => chooseLevel(item.value)}
              >
                {item.label}
                {progress.levels[item.value]?.phase === 'completed'
                  ? ' · Đã hoàn thành'
                  : ''}
              </AccessibleButton>
            ))}
          </div>
        </fieldset>
      )}
      {completed ? (
        <>
          <h2 ref={title} tabIndex={-1}>
            Em đã hoàn thành cấp độ {level}!
          </h2>
          <p>
            Đã giải {challenges.length}/{challenges.length} thử thách. Đúng ngay
            lần đầu: {session.firstTry}/{challenges.length}. Số lần thử chưa
            đúng: {session.mistakes}.
          </p>
          <VoiceGuidanceButton
            label="Nghe kết quả cuối"
            message={gameVoiceMessages.completed}
          />
          <div className="activity-actions">
            <AccessibleButton onClick={() => start(true)}>
              Chơi lại cấp độ {level}
            </AccessibleButton>
            {level < 3 && (
              <AccessibleButton
                variant="secondary"
                onClick={() => chooseLevel((level + 1) as GameLevel)}
              >
                Khám phá cấp độ tiếp theo
              </AccessibleButton>
            )}
          </div>
        </>
      ) : !active ? (
        <>
          <h2 ref={title} tabIndex={-1}>
            Sẵn sàng khám phá cấp độ {level}
          </h2>
          <p>
            Mỗi cấp độ có {challenges.length} thử thách. Đã giải {solved}/
            {challenges.length} thử thách ở cấp độ này. Em có thể tạm dừng bất
            cứ lúc nào.
          </p>
          {game.id === 'ghi-nho-nhip-dieu' && (
            <p>
              Khi tiếp tục, phần gõ đang dở sẽ bắt đầu lại; thử thách và điểm đã
              đạt vẫn được giữ.
            </p>
          )}
          <AccessibleButton onClick={() => start()}>
            {progress.levels[level] ? 'Tiếp tục trò chơi' : 'Bắt đầu trò chơi'}
          </AccessibleButton>
        </>
      ) : challenge ? (
        <>
          <div className="game-progress">
            <h2 ref={title} tabIndex={-1}>
              Thử thách {session.round + 1} trên {challenges.length} · Cấp độ{' '}
              {level}
            </h2>
            <progress
              aria-label="Tiến độ cấp độ"
              max={challenges.length}
              value={solved}
            />
          </div>
          {challenge.mode === 'choice' && challenge.chapter && (
            <p className="eyebrow">
              {challenge.chapter} · Chặng {session.round + 1}
            </p>
          )}
          <h3>{challenge.prompt}</h3>
          <ChallengeControls
            key={`${level}-${session.round}`}
            challenge={challenge}
            session={session}
            send={send}
            play={(sound) => void audio.play(sound)}
            stop={audio.stop}
            audioStatus={audio.status}
          />
          {feedback && (
            <div className={`game-feedback game-feedback--${session.feedback}`}>
              <p>{feedback}</p>
              <VoiceGuidanceButton
                label="Nghe phản hồi"
                message={
                  gameVoiceMessages[
                    session.feedback === 'correct' ? 'correct' : 'incorrect'
                  ]
                }
              />
            </div>
          )}
          {session.phase === 'feedback' && (
            <AccessibleButton
              onClick={() => {
                audio.stop();
                send({ type: 'next' });
              }}
            >
              {session.round === challenges.length - 1
                ? 'Xem kết quả'
                : 'Thử thách tiếp theo'}
            </AccessibleButton>
          )}
          <AccessibleButton
            variant="secondary"
            onClick={() => {
              audio.stop();
              voiceGuidance.stop();
              activityStore.getState().deactivate();
            }}
          >
            Tạm dừng trò chơi
          </AccessibleButton>
        </>
      ) : null}
      {audio.status === 'error' && (
        <p role="alert">
          Chưa phát được âm thanh. Em có thể thử nghe lại hoặc dùng mô tả bằng
          chữ.
        </p>
      )}
      <p className="game-keyboard-help">
        <kbd>Tab</kbd> để di chuyển · <kbd>Enter</kbd> hoặc <kbd>Space</kbd> để
        chọn · Không giới hạn thời gian.
      </p>
      <Link className="text-link" to="/games">
        Về danh sách trò chơi
      </Link>
    </section>
  );
}
