import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { activityGames, gameLevels } from '@/content/activityGames';
import { activityStore } from '@/stores/activityStore';
import {
  defaultPreferences,
  preferencesStore,
} from '@/stores/preferencesStore';
import { activityRepository } from '@/lib/storage/activityRepository';
import { GameAudio } from '@/engines/audio/GameAudio';
import { voiceGuidance } from '@/engines/audio/VoiceGuidance';
import { levelChallenges } from '@/engines/game/GameEngine';
import { activityKey } from '@/types/activity';
import type { ActivityGameDefinition, GameChallenge } from '@/types/game';
import { ActivityGame } from './ActivityGame';

beforeEach(async () => {
  await activityStore.getState().initialize();
  await preferencesStore.getState().initialize();
  activityStore.setState({
    records: {},
    activePath: null,
    status: 'ready',
    saveStatus: 'idle',
  });
  preferencesStore.setState({
    preferences: { ...defaultPreferences },
    status: 'ready',
  });
  vi.spyOn(GameAudio.prototype, 'play').mockResolvedValue(undefined);
});
afterEach(async () => {
  await activityStore.getState().flush();
});

function mount(game: ActivityGameDefinition) {
  return render(
    <MemoryRouter initialEntries={[`/games/${game.id}`]}>
      <ActivityGame game={game} />
    </MemoryRouter>,
  );
}

async function solveUI(
  user: ReturnType<typeof userEvent.setup>,
  challenge: GameChallenge,
) {
  if (challenge.mode === 'choice')
    await user.click(
      screen.getByRole('button', {
        name: challenge.options.find((o) => o.id === challenge.answer)!.label,
      }),
    );
  if (challenge.mode === 'sequence') {
    for (const id of challenge.sequence)
      await user.click(
        screen.getByRole('button', {
          name: challenge.palette.find((s) => s.id === id)!.label,
        }),
      );
    await user.click(screen.getByRole('button', { name: 'Kiểm tra chuỗi' }));
  }
  if (challenge.mode === 'pairs') {
    for (const id of new Set(challenge.cards.map((c) => c.sound.id))) {
      for (const card of challenge.cards.filter((c) => c.sound.id === id))
        await user.click(
          screen.getByRole('button', {
            name: new RegExp(`^Thẻ ${challenge.cards.indexOf(card) + 1} `),
          }),
        );
    }
  }
  if (challenge.mode === 'rhythm') {
    await user.click(screen.getByRole('button', { name: 'Chọn khoảng nghỉ' }));
    for (const interval of challenge.intervals)
      await user.click(
        screen.getByRole('button', {
          name: interval === 1 ? 'Ngắn' : interval === 2 ? 'Dài' : 'Rất dài',
        }),
      );
    await user.click(
      screen.getByRole('button', { name: 'Kiểm tra khoảng nghỉ' }),
    );
  }
}

describe('eight games through the UI', () => {
  it.each(activityGames)(
    '$title: introduction, all levels, results and replay',
    async (game) => {
      const user = userEvent.setup();
      mount(game);
      expect(
        screen.getByRole('heading', { name: 'Sẵn sàng khám phá cấp độ 1' }),
      ).toBeVisible();
      expect(screen.getByText(game.instructions)).toBeVisible();
      for (const level of [1, 2, 3] as const) {
        if (level > 1)
          await user.click(
            screen.getByRole('button', { name: gameLevels[level - 1]!.label }),
          );
        await user.click(
          screen.getByRole('button', { name: 'Bắt đầu trò chơi' }),
        );
        for (const challenge of levelChallenges(game, level)) {
          expect(
            screen.getByRole('heading', { level: 3, name: challenge.prompt }),
          ).toBeVisible();
          await solveUI(user, challenge);
          expect(
            screen.getByText(`Đúng rồi! ${challenge.explanation}`),
          ).toBeVisible();
          await user.click(
            screen.getByRole('button', {
              name:
                challenge === levelChallenges(game, level).at(-1)
                  ? 'Xem kết quả'
                  : 'Thử thách tiếp theo',
            }),
          );
        }
        expect(
          screen.getByRole('heading', {
            name: `Em đã hoàn thành cấp độ ${level}!`,
          }),
        ).toHaveFocus();
        expect(screen.getByText(/Đúng ngay lần đầu: 8\/8/)).toBeVisible();
        expect(activityStore.getState().activePath).toBeNull();
      }
      expect(
        activityStore.getState().records[activityKey('game', game.id)],
      ).toMatchObject({ completed: true, position: 24 });
      await user.click(
        screen.getByRole('button', { name: 'Chơi lại cấp độ 3' }),
      );
      expect(
        screen.getByRole('heading', { name: 'Thử thách 1 trên 8 · Cấp độ 3' }),
      ).toHaveFocus();
      const record =
        activityStore.getState().records[activityKey('game', game.id)];
      expect(record?.game?.levels[3]).toMatchObject({
        round: 0,
        firstTry: 0,
        mistakes: 0,
      });
      expect(record?.game?.levels[1]?.phase).toBe('completed');
      expect(record?.completed).toBe(false);
    },
    30_000,
  );

  it('shows incorrect feedback without advancing, then scores the retry correctly', async () => {
    const user = userEvent.setup();
    const game = activityGames[4]!;
    const challenge = game.challenges[0]!;
    if (challenge.mode !== 'choice') throw new Error('Expected choice');
    mount(game);
    await user.click(screen.getByRole('button', { name: 'Bắt đầu trò chơi' }));
    await user.click(
      screen.getByRole('button', {
        name: challenge.options.find((o) => o.id !== challenge.answer)!.label,
      }),
    );
    expect(screen.getByText(/Chưa đúng rồi/)).toBeVisible();
    expect(
      screen.getByRole('heading', { name: 'Thử thách 1 trên 8 · Cấp độ 1' }),
    ).toBeVisible();
    await solveUI(user, challenge);
    expect(
      activityStore.getState().records[activityKey('game', game.id)]?.game
        ?.levels[1],
    ).toMatchObject({ phase: 'feedback', firstTry: 0, mistakes: 1 });
  });

  it('restores a partial sequence from IndexedDB after remounting', async () => {
    const user = userEvent.setup();
    const game = activityGames[2]!;
    const view = mount(game);
    await user.click(screen.getByRole('button', { name: 'Bắt đầu trò chơi' }));
    await user.click(screen.getByRole('button', { name: 'Đô' }));
    await user.click(screen.getByRole('button', { name: 'Tạm dừng trò chơi' }));
    await activityStore.getState().flush();
    view.unmount();
    const saved = (await activityRepository.loadAll()).find(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        'id' in item &&
        item.id === game.id,
    );
    act(() =>
      activityStore.setState({
        records: {
          [activityKey('game', game.id)]: saved as NonNullable<
            ReturnType<typeof activityStore.getState>['records'][string]
          >,
        },
      }),
    );
    mount(game);
    await user.click(screen.getByRole('button', { name: 'Tiếp tục trò chơi' }));
    expect(screen.getByText('Chuỗi của em: Đô (1/2)')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Mi' }));
    await user.click(screen.getByRole('button', { name: 'Kiểm tra chuỗi' }));
    expect(screen.getByText(/Đúng rồi!/)).toBeVisible();
  });

  it('keeps a mismatched pair visible until hidden and exposes descriptions only for open cards', async () => {
    const user = userEvent.setup();
    const game = activityGames[3]!;
    const c = game.challenges[0]!;
    if (c.mode !== 'pairs') throw new Error('Expected pairs');
    mount(game);
    await user.click(screen.getByRole('button', { name: 'Bắt đầu trò chơi' }));
    await user.click(
      screen.getByRole('button', { name: 'Bật mô tả thẻ bằng chữ' }),
    );
    const a = c.cards[0]!;
    const b = c.cards.find((card) => card.sound.id !== a.sound.id)!;
    expect(
      screen.queryByText(`${a.sound.label}: ${a.sound.description}`),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^Thẻ 1 / }));
    expect(
      screen.getByText(`${a.sound.label}: ${a.sound.description}`),
    ).toBeVisible();
    await user.click(
      screen.getByRole('button', {
        name: new RegExp(`^Thẻ ${c.cards.indexOf(b) + 1} `),
      }),
    );
    expect(screen.getByText(/Hai âm thanh chưa khớp/)).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Úp hai thẻ' }));
    expect(
      screen.queryByText(`${a.sound.label}: ${a.sound.description}`),
    ).not.toBeInTheDocument();
    await solveUI(user, c);
    expect(screen.getByText(`Đúng rồi! ${c.explanation}`)).toBeVisible();
  });

  it('supports keyboard-only starting, answering and advancing with focused headings', async () => {
    const user = userEvent.setup();
    mount(activityGames[4]!);
    while (
      document.activeElement !==
      screen.getByRole('button', { name: 'Bắt đầu trò chơi' })
    )
      await user.tab();
    await user.keyboard('{Enter}');
    expect(
      screen.getByRole('heading', { name: 'Thử thách 1 trên 8 · Cấp độ 1' }),
    ).toHaveFocus();
    while (
      document.activeElement !== screen.getByRole('button', { name: 'Tai' })
    )
      await user.tab();
    await user.keyboard(' ');
    expect(screen.getByText(/Đúng rồi!/)).toBeVisible();
    while (
      document.activeElement !==
      screen.getByRole('button', { name: 'Thử thách tiếp theo' })
    )
      await user.tab();
    await user.keyboard('{Enter}');
    expect(
      screen.getByRole('heading', { name: 'Thử thách 2 trên 8 · Cấp độ 1' }),
    ).toHaveFocus();
  });

  it('judges actual keyboard taps and lets the player clear an incorrect attempt', async () => {
    const user = userEvent.setup();
    mount(activityGames[7]!);
    await user.click(screen.getByRole('button', { name: 'Bắt đầu trò chơi' }));
    const now = vi.spyOn(performance, 'now');
    const tap = screen.getByRole('button', { name: 'Gõ nhịp' });
    tap.focus();
    for (const time of [100, 600, 2000]) {
      now.mockReturnValue(time);
      await user.keyboard('{Enter}');
    }
    await user.click(screen.getByRole('button', { name: 'Kiểm tra nhịp' }));
    expect(screen.getByText(/Chưa đúng rồi/)).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Gõ lại' }));
    tap.focus();
    for (const time of [3000, 4000, 5000]) {
      now.mockReturnValue(time);
      await user.keyboard(' ');
    }
    await user.click(screen.getByRole('button', { name: 'Kiểm tra nhịp' }));
    expect(screen.getByText(/Đúng rồi!/)).toBeVisible();
  });

  it('offers real recorded guidance and question audio after enabling voice', async () => {
    const user = userEvent.setup();
    const speak = vi.spyOn(voiceGuidance, 'speak').mockResolvedValue(undefined);
    const game = activityGames[5]!;
    mount(game);
    expect(speak).not.toHaveBeenCalled();
    await user.click(
      screen.getByRole('button', { name: 'Bật hướng dẫn giọng nói' }),
    );
    await user.click(
      await screen.findByRole('button', { name: 'Nghe hướng dẫn' }),
    );
    expect(speak).toHaveBeenLastCalledWith(
      expect.objectContaining({
        audioSrc: game.guidanceAudioSrc,
        text: `${game.title}. ${game.instructions}`,
      }),
    );
    await user.click(screen.getByRole('button', { name: 'Bắt đầu trò chơi' }));
    await user.click(screen.getByRole('button', { name: 'Nghe câu hỏi' }));
    expect(speak).toHaveBeenLastCalledWith(
      expect.objectContaining({ audioSrc: game.challenges[0]!.audioSrc }),
    );
  });

  it('can answer through text when Web Audio is unavailable', async () => {
    const user = userEvent.setup();
    vi.mocked(GameAudio.prototype.play).mockRejectedValue(
      new Error('Unavailable'),
    );
    const game = activityGames[0]!;
    mount(game);
    await user.click(screen.getByRole('button', { name: 'Bắt đầu trò chơi' }));
    await user.click(screen.getByRole('button', { name: 'Nghe âm thanh' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Chưa phát được âm thanh',
    );
    await user.click(screen.getByText('Mô tả thử thách bằng chữ'));
    expect(screen.getByText(game.challenges[0]!.description)).toBeVisible();
    await solveUI(user, game.challenges[0]!);
    expect(screen.getByText(/Đúng rồi!/)).toBeVisible();
  });

  it('reports a failed save, retains the session and retries the same snapshot', async () => {
    const user = userEvent.setup();
    const save = vi
      .spyOn(activityRepository, 'save')
      .mockRejectedValue(new Error('Quota'));
    const game = activityGames[4]!;
    mount(game);
    await user.click(screen.getByRole('button', { name: 'Bắt đầu trò chơi' }));
    await solveUI(user, game.challenges[0]!);
    await waitFor(() =>
      expect(screen.getByText(/Chưa lưu được trên thiết bị/)).toBeVisible(),
    );
    save.mockResolvedValue(undefined);
    await user.click(
      screen.getByRole('button', { name: 'Thử lưu tiến độ lại' }),
    );
    await waitFor(() =>
      expect(screen.getByText('Đã lưu tiến độ trên thiết bị.')).toBeVisible(),
    );
    expect(save).toHaveBeenLastCalledWith(
      expect.objectContaining({
        game: expect.objectContaining({
          levels: expect.objectContaining({
            1: expect.objectContaining({ phase: 'feedback' }),
          }),
        }),
      }),
    );
  });
});
