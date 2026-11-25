import { useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AccessibleButton,
  AppCard,
  EmptyState,
  PageHeader,
} from '@/design-system';
import { sections } from '@/content/sections';
import { stories, storyCollections, storyLevels } from '@/content/stories';
import { storyInterface } from '@/content/storyInterface';
import audioAvailability from '@/content/stories/audio-availability.json';
import { filterStories } from '@/lib/stories/filterStories';
import { activityPath } from '@/types/activity';
import './Stories.css';

export default function StoriesPage() {
  const [params, setParams] = useSearchParams();
  const searchInput = useRef<HTMLInputElement>(null);
  const query = params.get('q') ?? '';
  const level = storyLevels.find(
    (item) => String(item.id) === params.get('level'),
  );
  const collection = storyCollections.collections.find(
    (item) => item.id === params.get('collection'),
  );
  const results = filterStories(stories, {
    query,
    level: level?.id ?? null,
    storyIds: collection?.storyIds ?? null,
  });

  function changeFilter(key: string, value: string) {
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (value === '' || (key !== 'q' && value === 'all')) next.delete(key);
        else next.set(key, value);
        return next;
      },
      { replace: true },
    );
  }

  return (
    <div className="story-library">
      <PageHeader
        title={sections.stories.title}
        description={sections.stories.description}
      />
      <p className="story-notice">{storyInterface.audioAvailable}</p>
      {stories.length === 0 ? (
        <EmptyState
          headingLevel={2}
          title={storyInterface.emptyLibrary}
          description={storyInterface.emptyLibraryDescription}
          action={
            <Link className="button" to="/">
              Về trang khám phá
            </Link>
          }
        />
      ) : (
        <>
          <form
            className="story-filters"
            role="search"
            aria-label="Tìm và lọc truyện"
            onSubmit={(event) => event.preventDefault()}
          >
            <label>
              Tìm truyện
              <input
                type="search"
                ref={searchInput}
                value={query}
                onChange={(event) => changeFilter('q', event.target.value)}
                placeholder="Tên truyện, có hoặc không dấu"
              />
            </label>
            <label>
              Cấp độ
              <select
                value={level ? String(level.id) : 'all'}
                onChange={(event) => changeFilter('level', event.target.value)}
              >
                <option value="all">Tất cả cấp độ</option>
                {storyLevels.map((item) => (
                  <option key={item.id} value={item.id}>
                    Cấp {item.id}: {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Bộ truyện
              <select
                value={collection?.id ?? 'all'}
                onChange={(event) =>
                  changeFilter('collection', event.target.value)
                }
              >
                <option value="all">Tất cả bộ truyện</option>
                {storyCollections.collections.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            </label>
          </form>
          <p
            role="status"
            aria-label="Kết quả tìm truyện"
            className="story-result-count"
          >
            Hiển thị {results.length} trên {stories.length} truyện.
          </p>
          {results.length === 0 ? (
            <EmptyState
              headingLevel={2}
              title={storyInterface.noMatches}
              description={storyInterface.noMatchesDescription}
              action={
                <AccessibleButton
                  onClick={() => {
                    setParams({}, { replace: true });
                    searchInput.current?.focus();
                  }}
                >
                  Xem tất cả truyện
                </AccessibleButton>
              }
            />
          ) : (
            <section
              aria-label="Danh sách truyện"
              className="category-grid story-grid"
            >
              {results.map((story) => (
                <AppCard
                  key={story.id}
                  headingLevel={2}
                  title={story.title}
                  description={story.introduction}
                  icon="stories"
                >
                  <p className="story-metadata">
                    Cấp {story.level}:{' '}
                    {storyLevels.find((item) => item.id === story.level)?.name}{' '}
                    · {story.source ? 'Truyện kể lại' : 'Truyện gốc'}
                  </p>
                  <p>
                    {audioAvailability.stories.some(
                      (item) =>
                        item.id === story.id &&
                        item.scenes === story.scenes.length,
                    )
                      ? 'Có bản đọc tiếng Việt'
                      : 'Hiện có bản chữ'}
                  </p>
                  <Link className="button" to={activityPath('story', story.id)}>
                    Nghe hoặc đọc: {story.title}
                  </Link>
                </AppCard>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
