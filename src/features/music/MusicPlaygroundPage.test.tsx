import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { stopAudio } from '@/engines/audio/audioFocus';
import { deferred } from '@/test/audioTestUtils';
import { musicAudioPlatform } from '@/test/musicAudioPlatform';
import { loadCompositions, MUSIC_STORAGE_KEY } from '@/lib/music/compositions';
import MusicPlaygroundPage from './MusicPlaygroundPage';

function open() {
  return render(
    <MemoryRouter>
      <MusicPlaygroundPage />
    </MemoryRouter>,
  );
}
const pad = (label: string) =>
  screen.getByRole('button', {
    name: new RegExp(`^${label} [A-Z], chơi nốt nhạc`),
  });
const composer = () =>
  screen.getByRole('status', { name: 'Thông báo sáng tác' });
beforeEach(() => {
  localStorage.clear();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Music Playground', () => {
  it('provides step guidance, safe default volume, no autoplay and opt-in scoped shortcuts', async () => {
    const p = musicAudioPlatform();
    const user = userEvent.setup();
    open();
    expect(screen.getByRole('heading', { level: 1 })).toHaveFocus();
    expect(p.constructor).not.toHaveBeenCalled();
    expect(screen.getByRole('slider', { name: /Âm lượng nhạc/ })).toHaveValue(
      '30',
    );
    const keys = pad('Đô');
    keys.focus();
    await user.keyboard('a');
    expect(p.constructor).not.toHaveBeenCalled();
    await user.click(screen.getByRole('checkbox', { name: /Bật phím tắt/ }));
    keys.focus();
    await user.keyboard('as');
    expect(
      screen.getByRole('heading', { name: 'Chuỗi của em: 2 trên 64 bước' }),
    ).toBeVisible();
    fireEvent.keyDown(keys, { key: 'a', repeat: true });
    await user.keyboard('{Control>}a{/Control}');
    expect(
      screen.getByRole('heading', { name: 'Chuỗi của em: 2 trên 64 bước' }),
    ).toBeVisible();
    const name = screen.getByRole('textbox', { name: 'Tên bản nhạc' });
    await user.clear(name);
    await user.type(name, 'asdf');
    expect(
      screen.getByRole('heading', { name: 'Chuỗi của em: 2 trên 64 bước' }),
    ).toBeVisible();
    await user.click(
      screen.getByRole('checkbox', { name: 'Thêm nốt đã chơi vào bản nhạc' }),
    );
    await user.click(pad('Mi'));
    expect(composer()).toHaveTextContent('Đang chơi Mi');
    await user.keyboard('{Escape}');
    expect(
      screen.getByRole('status', { name: 'Trạng thái phát nhạc' }),
    ).toHaveTextContent('Âm thanh đã dừng.');
    expect(p.oscillators.at(-1)!.stop).toHaveBeenLastCalledWith(10.015);
  });

  it('explores instruments and plays samples without adding them to the composition', async () => {
    const p = musicAudioPlatform();
    const user = userEvent.setup();
    open();
    await user.click(screen.getByRole('button', { name: /Sáo Họ hơi/ }));
    expect(screen.getByRole('button', { name: /Sáo Họ hơi/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await user.click(screen.getByRole('button', { name: 'Nghe mẫu Sáo' }));
    expect(p.oscillators).toHaveLength(3);
    expect(
      screen.getByRole('heading', { name: 'Chuỗi của em: 0 trên 64 bước' }),
    ).toBeVisible();
    await user.click(pad('Đô'));
    expect(
      screen.getByRole('combobox', { name: 'Nhạc cụ ở bước 1' }),
    ).toHaveValue('flute');
  });

  it('creates, reorders, edits and persists a composition; reloads, updates and deletes it', async () => {
    const p = musicAudioPlatform();
    const user = userEvent.setup();
    const view = open();
    await user.click(pad('Đô'));
    await user.click(pad('Mi'));
    await user.click(screen.getByRole('button', { name: 'Thêm khoảng nghỉ' }));
    await user.click(
      screen.getByRole('button', { name: 'Đưa bước 2 lên trước' }),
    );
    expect(screen.getByRole('combobox', { name: 'Nốt ở bước 1' })).toHaveValue(
      'E4',
    );
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Độ dài bước 1' }),
      '2',
    );
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Nhạc cụ ở bước 1' }),
      'bell',
    );
    await user.clear(screen.getByRole('textbox', { name: 'Tên bản nhạc' }));
    await user.type(
      screen.getByRole('textbox', { name: 'Tên bản nhạc' }),
      'Hoa nắng',
    );
    await user.click(screen.getByRole('button', { name: 'Phát lại bản nhạc' }));
    act(() => p.end());
    expect(composer()).toHaveTextContent('Đã phát xong');
    await user.click(screen.getByRole('button', { name: 'Lưu bản nhạc' }));
    expect(loadCompositions()[0]).toMatchObject({
      name: 'Hoa nắng',
      steps: [
        { note: 'E4', instrument: 'bell', beats: 2 },
        { note: 'C4', instrument: 'piano', beats: 1 },
        { note: null, instrument: 'piano', beats: 1 },
      ],
    });
    view.unmount();
    open();
    await user.click(
      screen.getByRole('button', { name: 'Chỉnh sửa bản nhạc Hoa nắng' }),
    );
    expect(
      screen.getByRole('heading', { name: '3. Bản nhạc của em' }),
    ).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Xóa bước 3' }));
    await user.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));
    expect(loadCompositions()).toHaveLength(1);
    expect(loadCompositions()[0]!.steps).toHaveLength(2);
    await user.click(
      screen.getByRole('button', { name: 'Nghe bản nhạc Hoa nắng' }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Xóa bản nhạc Hoa nắng' }),
    );
    expect(loadCompositions()).toEqual([]);
    expect(
      screen.getByRole('heading', { name: 'Bản nhạc đã lưu trên thiết bị' }),
    ).toHaveFocus();
  });

  it('keeps the draft after a failed save and does not overwrite unreadable storage', async () => {
    musicAudioPlatform();
    const user = userEvent.setup();
    const view = open();
    await user.click(pad('Đô'));
    const save = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('Quota');
      });
    await user.click(screen.getByRole('button', { name: 'Lưu bản nhạc' }));
    expect(composer()).toHaveTextContent('Chưa lưu được');
    expect(
      screen.getByRole('heading', { name: 'Chuỗi của em: 1 trên 64 bước' }),
    ).toBeVisible();
    expect(loadCompositions()).toEqual([]);
    save.mockRestore();
    view.unmount();
    localStorage.setItem(MUSIC_STORAGE_KEY, '{bad');
    open();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Dữ liệu cũ được giữ nguyên',
    );
    await user.click(pad('Đô'));
    expect(screen.getByRole('button', { name: 'Lưu bản nhạc' })).toBeDisabled();
    expect(localStorage.getItem(MUSIC_STORAGE_KEY)).toBe('{bad');
    localStorage.removeItem(MUSIC_STORAGE_KEY);
    await user.click(screen.getByRole('button', { name: 'Tải lại thư viện' }));
    expect(screen.getByRole('button', { name: 'Lưu bản nhạc' })).toBeEnabled();
  });

  it('cancels deferred playback on stop, other audio focus, backgrounding and unmount', async () => {
    const p = musicAudioPlatform();
    const user = userEvent.setup();
    const pending = deferred<void>();
    p.context.resume.mockReturnValueOnce(pending.promise);
    const view = open();
    await user.click(pad('Đô'));
    await user.click(screen.getByRole('button', { name: 'Dừng âm thanh' }));
    await act(async () => {
      pending.resolve();
      await pending.promise;
    });
    expect(p.oscillators).toHaveLength(0);
    await user.click(pad('Mi'));
    act(() => stopAudio());
    expect(
      screen.getByRole('status', { name: 'Trạng thái phát nhạc' }),
    ).toHaveTextContent('Âm thanh đã dừng');
    await user.click(pad('Fa'));
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    fireEvent(document, new Event('visibilitychange'));
    expect(
      screen.getByRole('status', { name: 'Trạng thái phát nhạc' }),
    ).toHaveTextContent('Âm thanh đã dừng');
    view.unmount();
    expect(p.context.close).toHaveBeenCalledOnce();
  });

  it('reports unsupported audio and permits retry', async () => {
    vi.stubGlobal('AudioContext', undefined);
    const user = userEvent.setup();
    open();
    await user.click(screen.getByRole('button', { name: 'Nghe mẫu Đàn phím' }));
    expect(
      screen.getByRole('status', { name: 'Trạng thái phát nhạc' }),
    ).toHaveTextContent('Không phát được');
    const p = musicAudioPlatform();
    await user.click(screen.getByRole('button', { name: 'Nghe mẫu Đàn phím' }));
    expect(p.oscillators).toHaveLength(3);
  });

  it('plays melody memory with completion gating, incorrect/correct feedback, correction and replay', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const p = musicAudioPlatform();
    const user = userEvent.setup();
    open();
    const game = screen.getByRole('region', { name: '4. Chơi cùng âm nhạc' });
    const choices = within(game).getByRole('group', {
      name: 'Chọn lại các nốt đã nghe',
    });
    const result = within(game).getByRole('status');
    expect(within(choices).getByRole('button', { name: 'Đô' })).toBeDisabled();
    await user.click(within(game).getByRole('button', { name: 'Nghe đề bài' }));
    expect(within(choices).getByRole('button', { name: 'Đô' })).toBeDisabled();
    act(() => p.end());
    await user.click(within(choices).getByRole('button', { name: 'Đô' }));
    await user.click(within(choices).getByRole('button', { name: 'Đô' }));
    await user.click(within(choices).getByRole('button', { name: 'Rê' }));
    expect(result).toHaveTextContent('Chưa trùng');
    await user.click(
      within(game).getByRole('button', { name: 'Sửa nốt cuối' }),
    );
    await user.click(within(choices).getByRole('button', { name: 'Đô' }));
    expect(result).toHaveTextContent('Đúng rồi');
    await user.click(within(game).getByRole('button', { name: 'Nghe đề bài' }));
    expect(
      within(game).getByText('Câu trả lời: chưa chọn nốt nào.'),
    ).toBeVisible();
    await user.click(within(game).getByRole('button', { name: 'Câu mới' }));
    act(() => p.end());
    expect(result).toHaveTextContent('Chọn Nghe đề bài');
  });

  it('lets rhythm players audition every choice, retry without time pressure and start a new round', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const p = musicAudioPlatform();
    const user = userEvent.setup();
    open();
    await user.click(
      screen.getByRole('button', { name: 'Nhận diện nhịp điệu' }),
    );
    expect(screen.getByRole('button', { name: 'Chọn nhịp 1' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Nghe đề bài' }));
    act(() => p.end());
    for (let i = 1; i <= 3; i++) {
      await user.click(screen.getByRole('button', { name: `Nghe nhịp ${i}` }));
      act(() => p.end());
    }
    await user.click(screen.getByRole('button', { name: 'Chọn nhịp 2' }));
    expect(
      screen.getByRole('status', { name: 'Kết quả trò chơi âm nhạc' }),
    ).toHaveTextContent('Chưa trùng');
    await user.click(screen.getByRole('button', { name: 'Chọn nhịp 1' }));
    expect(
      screen.getByRole('status', { name: 'Kết quả trò chơi âm nhạc' }),
    ).toHaveTextContent('Đúng rồi');
  });
});
