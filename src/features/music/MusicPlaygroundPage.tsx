import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { voiceGuidance } from '@/engines/audio/VoiceGuidance';
import { PageHeader } from '@/components/molecules/PageHeader';
import { AccessibleButton } from '@/components/atoms/AccessibleButton';
import { VoiceGuidanceButton } from '@/accessibility/VoiceGuidanceButton';
import { musicVoiceMessages } from '@/content/musicVoiceMessages';
import {
  DEFAULT_MUSIC_VOLUME,
  DEFAULT_TEMPO,
  InstrumentLibrary,
  MAX_MUSIC_STEPS,
  musicNotes,
  stepLabel,
  type InstrumentId,
  type MusicStep,
  type NoteId,
} from '@/engines/music/InstrumentLibrary';
import {
  loadCompositions,
  MAX_COMPOSITIONS,
  saveCompositions,
  type Composition,
} from '@/lib/music/compositions';
import { useMusicEngine } from '@/hooks/useMusicEngine';
import { MusicGames } from './MusicGames';
import { SequenceEditor } from './SequenceEditor';
import './music.css';

function initialLibrary() {
  try {
    return { songs: loadCompositions(), error: '' };
  } catch {
    return {
      songs: [] as Composition[],
      error:
        'Không đọc được bản nhạc đã lưu. Dữ liệu cũ được giữ nguyên. Em vẫn có thể chơi và thử tải lại thư viện.',
    };
  }
}

export default function MusicPlaygroundPage() {
  const audio = useMusicEngine();
  const [library, setLibrary] = useState(initialLibrary);
  const [instrument, setInstrument] = useState<InstrumentId>('piano');
  const [volume, setVolume] = useState(DEFAULT_MUSIC_VOLUME);
  const [shortcuts, setShortcuts] = useState(false);
  const [recording, setRecording] = useState(true);
  const [steps, setSteps] = useState<MusicStep[]>([]);
  const [tempo, setTempo] = useState(DEFAULT_TEMPO);
  const [name, setName] = useState('Giai điệu của em');
  const [editing, setEditing] = useState<string | null>(null);
  const [message, setMessage] = useState(
    'Sẵn sàng. Âm thanh chỉ phát khi em chọn nghe hoặc chơi.',
  );
  const editorHeading = useRef<HTMLHeadingElement>(null);
  const libraryHeading = useRef<HTMLHeadingElement>(null);
  const currentInstrument = InstrumentLibrary.find(
    (item) => item.id === instrument,
  )!;
  const busy = audio.status === 'loading' || audio.status === 'playing';
  const stop = audio.stop;
  useEffect(() => {
    const escape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      voiceGuidance.stop();
      stop();
      setMessage('Đã dừng âm thanh.');
    };
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, [stop]);

  function changeSteps(next: MusicStep[]) {
    audio.stop();
    setSteps(next);
    setMessage(
      `Bản nhạc có ${next.length} bước. Chọn Phát lại bản nhạc để nghe thay đổi.`,
    );
  }

  function playNote(note: NoteId) {
    const step: MusicStep = { note, instrument, beats: 1 };
    void audio.play([step]);
    if (recording && steps.length < MAX_MUSIC_STEPS) {
      setSteps((previous) =>
        previous.length < MAX_MUSIC_STEPS ? [...previous, step] : previous,
      );
      setMessage(`${stepLabel(step)}. Đã thêm vào bản nhạc.`);
    } else
      setMessage(
        recording
          ? 'Đã đủ 64 bước. Em có thể sửa hoặc xóa bớt bước trước khi thêm.'
          : `Đang chơi ${stepLabel(step)}.`,
      );
  }

  function keyboard(event: KeyboardEvent<HTMLButtonElement>) {
    if (
      !shortcuts ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.nativeEvent.isComposing
    )
      return;
    const target = event.target as HTMLElement;
    if (target.closest('input, select, textarea, [contenteditable="true"]'))
      return;
    const note = musicNotes.find(
      (item) => item.key === event.key.toLowerCase(),
    );
    if (!note) return;
    event.preventDefault();
    if (!event.repeat) playNote(note.id);
  }

  function commit(songs: Composition[], success: string) {
    try {
      saveCompositions(songs);
      setLibrary({ songs, error: '' });
      setMessage(success);
      return true;
    } catch {
      setMessage(
        'Chưa lưu được thay đổi trên thiết bị. Bộ nhớ có thể đầy hoặc bị chặn. Bản đang soạn vẫn còn ở đây; em hãy thử lại.',
      );
      return false;
    }
  }

  function save() {
    if (!steps.length || !name.trim() || library.error) return;
    const song: Composition = {
      id: editing ?? crypto.randomUUID(),
      name: name.trim(),
      tempo,
      steps: steps.map((step) => ({ ...step })),
    };
    const next = editing
      ? library.songs.map((item) => (item.id === editing ? song : item))
      : [...library.songs, song];
    if (commit(next, `Đã lưu ${song.name} trên thiết bị này.`))
      setEditing(song.id);
  }

  return (
    <div className="music-playground">
      <PageHeader
        eyebrow="MUSIC PLAYGROUND"
        title="Khu vườn âm nhạc"
        description="Lắng nghe, chạm một nốt, gieo một giai điệu của riêng em."
      />
      <section
        className="music-panel music-welcome"
        aria-labelledby="music-guide-title"
      >
        <h2 id="music-guide-title">Bắt đầu từng bước</h2>
        <ol>
          <li>
            Em chọn một nhạc cụ rồi nghe thử xem tiếng của nó thế nào nhé.
          </li>
          <li>
            Chạm vào các nốt để chơi thử. Nếu dùng bàn phím, em bấm Tab để đến
            nốt muốn chơi, rồi Enter hoặc phím cách.
          </li>
          <li>
            Giữ bật Thêm nốt đã chơi vào bản nhạc để gom các nốt thành giai điệu
            của em. Em có thể sửa, nghe lại, đặt tên rồi lưu nhé.
          </li>
        </ol>
        <VoiceGuidanceButton
          message={musicVoiceMessages.playground}
          label="Nghe hướng dẫn từng bước"
        />
        <p>
          Âm lượng bắt đầu ở 30%. Em hãy để âm lượng thiết bị ở mức nhỏ, dễ
          chịu. Mỗi lần chỉ phát một chuỗi âm thanh.
        </p>
        <p>
          Âm thanh được tổng hợp tại thiết bị, gợi tiếng nhạc cụ, không dùng bản
          thu hay nhạc có bản quyền. Sau khi ứng dụng báo sẵn sàng ngoại tuyến,
          em có thể chơi và mở nhạc đã lưu mà không cần mạng.
        </p>
      </section>

      <section
        className="music-panel music-controls"
        aria-labelledby="music-audio-title"
      >
        <h2 id="music-audio-title">Điều khiển âm thanh</h2>
        <label htmlFor="music-volume">
          Âm lượng nhạc: {Math.round(volume * 100)}%
        </label>
        <input
          id="music-volume"
          type="range"
          min="0"
          max="100"
          step="5"
          value={Math.round(volume * 100)}
          aria-valuetext={`${Math.round(volume * 100)} phần trăm`}
          onChange={(event) => {
            const next = Number(event.target.value) / 100;
            setVolume(next);
            audio.setVolume(next);
          }}
        />
        <AccessibleButton
          variant="danger"
          onClick={() => {
            voiceGuidance.stop();
            audio.stop();
            setMessage('Đã dừng âm thanh.');
          }}
        >
          Dừng âm thanh
        </AccessibleButton>
        <p>Nhấn Escape khi đang ở trang này để dừng.</p>
        <p role="status" aria-label="Trạng thái phát nhạc">
          {busy
            ? 'Đang phát âm thanh.'
            : audio.status === 'error'
              ? 'Không phát được âm thanh. Em có thể thử nghe lại. Trình duyệt cần hỗ trợ Web Audio.'
              : 'Âm thanh đã dừng.'}
        </p>
      </section>

      <section
        className="music-panel"
        aria-labelledby="music-instruments-title"
      >
        <h2 id="music-instruments-title">1. Khám phá nhạc cụ</h2>
        <fieldset>
          <legend>Chọn tiếng nhạc cụ</legend>
          <div className="music-instrument-grid">
            {InstrumentLibrary.map((item) => (
              <AccessibleButton
                key={item.id}
                variant="secondary"
                aria-pressed={instrument === item.id}
                onClick={() => {
                  audio.stop();
                  setInstrument(item.id);
                  setMessage(`Đã chọn ${item.name}. ${item.description}`);
                }}
              >
                <span>{item.name}</span>{' '}
                <small>Họ {item.family.toLowerCase()}</small>
              </AccessibleButton>
            ))}
          </div>
        </fieldset>
        <p>{currentInstrument.description}</p>
        <AccessibleButton
          onClick={() =>
            void audio.play(
              ['C4', 'E4', 'G4'].map((note) => ({
                note: note as NoteId,
                instrument,
                beats: 1,
              })),
            )
          }
        >
          Nghe mẫu {currentInstrument.name}
        </AccessibleButton>
      </section>

      <section className="music-panel" aria-labelledby="music-play-title">
        <h2 id="music-play-title">2. Chơi những nốt đầu tiên</h2>
        <label className="music-check">
          <input
            type="checkbox"
            checked={shortcuts}
            onChange={(event) => setShortcuts(event.target.checked)}
          />
          Bật phím tắt A S D F G H J K trong khu vực chơi nhạc
        </label>
        <label className="music-check">
          <input
            type="checkbox"
            checked={recording}
            onChange={(event) => setRecording(event.target.checked)}
          />
          Thêm nốt đã chơi vào bản nhạc
        </label>
        <p id="music-keyboard-help">
          Chạm vào nút để chơi. Với bàn phím: Tab đến từng nốt rồi Enter hoặc
          dấu cách. Khi bật phím tắt, Tab vào khu vực bên dưới; A S D F G H J K
          tương ứng Đô Rê Mi Fa Sol La Si Đô cao. Trình đọc màn hình có thể cần
          chế độ tương tác để dùng phím chữ.
        </p>
        <div
          className="music-keyboard"
          role="group"
          aria-label="Khu vực chơi nhạc"
          aria-describedby="music-keyboard-help"
        >
          <div className="music-note-grid">
            {musicNotes.map((note) => (
              <AccessibleButton
                key={note.id}
                className="music-note"
                variant="secondary"
                aria-label={`${note.label} ${note.key.toUpperCase()}, chơi nốt nhạc`}
                aria-keyshortcuts={
                  shortcuts ? note.key.toUpperCase() : undefined
                }
                onClick={() => playNote(note.id)}
                onKeyDown={keyboard}
              >
                <strong>{note.label}</strong>{' '}
                <kbd>{note.key.toUpperCase()}</kbd>
              </AccessibleButton>
            ))}
          </div>
        </div>
      </section>

      <section className="music-panel" aria-labelledby="music-compose-title">
        <h2 id="music-compose-title" ref={editorHeading} tabIndex={-1}>
          3. Bản nhạc của em
        </h2>
        <p>
          {editing
            ? 'Đang chỉnh sửa bản đã lưu. Chọn Lưu thay đổi để cập nhật.'
            : 'Đang sáng tác bản mới.'}{' '}
          Mỗi nốt vừa chơi được thêm một phách khi bật thêm nốt.
        </p>
        <div className="music-step-fields">
          <label>
            Tên bản nhạc
            <input
              value={name}
              maxLength={80}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label>
            Tốc độ (phách mỗi phút)
            <select
              value={tempo}
              onChange={(event) => {
                audio.stop();
                setTempo(Number(event.target.value));
              }}
            >
              {[60, 80, 100, 120, 140, 160].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="music-actions">
          <AccessibleButton
            disabled={!steps.length}
            onClick={() =>
              void audio.play(steps, tempo, () =>
                setMessage('Đã phát xong bản nhạc.'),
              )
            }
          >
            Phát lại bản nhạc
          </AccessibleButton>
          <AccessibleButton
            variant="secondary"
            disabled={steps.length >= MAX_MUSIC_STEPS}
            onClick={() =>
              changeSteps([...steps, { note: null, instrument, beats: 1 }])
            }
          >
            Thêm khoảng nghỉ
          </AccessibleButton>
          <AccessibleButton
            disabled={
              !steps.length ||
              !name.trim() ||
              !!library.error ||
              (!editing && library.songs.length >= MAX_COMPOSITIONS)
            }
            onClick={save}
          >
            {editing ? 'Lưu thay đổi' : 'Lưu bản nhạc'}
          </AccessibleButton>
          <AccessibleButton
            variant="secondary"
            onClick={() => {
              audio.stop();
              setSteps([]);
              setEditing(null);
              setName('Giai điệu của em');
              setTempo(DEFAULT_TEMPO);
              setMessage('Đã mở bản nhạc mới.');
            }}
          >
            Tạo bản mới (xóa bản đang soạn)
          </AccessibleButton>
        </div>
        <SequenceEditor steps={steps} onChange={changeSteps} />
      </section>

      <p
        className="music-notice"
        role="status"
        aria-label="Thông báo sáng tác"
        aria-atomic="true"
      >
        {message}
      </p>
      <VoiceGuidanceButton
        label="Nghe thông báo sáng tác"
        message={{ id: `music-composer-${message}`, text: message }}
      />

      <section className="music-panel" aria-labelledby="music-library-title">
        <h2 id="music-library-title" ref={libraryHeading} tabIndex={-1}>
          Bản nhạc đã lưu trên thiết bị
        </h2>
        <p>
          Đã lưu {library.songs.length} trên {MAX_COMPOSITIONS} bản. Xóa dữ liệu
          trình duyệt sẽ xóa các bản nhạc này.
        </p>
        {library.error ? (
          <>
            <p role="alert">{library.error}</p>
            <AccessibleButton onClick={() => setLibrary(initialLibrary())}>
              Tải lại thư viện
            </AccessibleButton>
          </>
        ) : !library.songs.length ? (
          <p>Chưa có bản nhạc đã lưu.</p>
        ) : (
          <ul className="music-saved-list">
            {library.songs.map((song) => (
              <li key={song.id}>
                <h3>{song.name}</h3>
                <p>
                  {song.steps.length} bước · {song.tempo} phách mỗi phút
                </p>
                <div className="music-actions">
                  <AccessibleButton
                    aria-label={`Nghe bản nhạc ${song.name}`}
                    onClick={() => void audio.play(song.steps, song.tempo)}
                  >
                    Nghe
                  </AccessibleButton>
                  <AccessibleButton
                    variant="secondary"
                    aria-label={`Chỉnh sửa bản nhạc ${song.name}`}
                    onClick={() => {
                      audio.stop();
                      setSteps(song.steps.map((step) => ({ ...step })));
                      setName(song.name);
                      setTempo(song.tempo);
                      setEditing(song.id);
                      setMessage(`Đang sửa ${song.name}.`);
                      editorHeading.current?.focus();
                    }}
                  >
                    Chỉnh sửa
                  </AccessibleButton>
                  <AccessibleButton
                    variant="danger"
                    aria-label={`Xóa bản nhạc ${song.name}`}
                    onClick={() => {
                      audio.stop();
                      if (
                        commit(
                          library.songs.filter((item) => item.id !== song.id),
                          `Đã xóa ${song.name}.`,
                        )
                      ) {
                        if (editing === song.id) setEditing(null);
                        libraryHeading.current?.focus();
                      }
                    }}
                  >
                    Xóa bản nhạc
                  </AccessibleButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <MusicGames audio={audio} />
    </div>
  );
}
