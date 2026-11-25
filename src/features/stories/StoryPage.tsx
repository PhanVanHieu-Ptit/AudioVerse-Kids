import { Link, useParams } from 'react-router-dom';
import { EmptyState, PageHeader } from '@/design-system';
import { getStory, storyLevels } from '@/content/stories';
import { storyInterface } from '@/content/storyInterface';
import { StoryReader } from './StoryReader';
import { StoryDownload } from './StoryDownload';
import './Stories.css';

export default function StoryPage() {
  const { storyId } = useParams();
  const story = storyId ? getStory(storyId) : undefined;
  return (
    <>
      <PageHeader
        title={story?.title ?? 'Nghe truyện'}
        description={
          story?.introduction ?? 'Một không gian để lắng nghe theo nhịp của em.'
        }
      />
      {story ? (
        <div className="story-detail">
          <p>
            Cấp {story.level}:{' '}
            {storyLevels.find((level) => level.id === story.level)?.name}.{' '}
            {storyInterface.readingInstructions}
          </p>
          {story.source && (
            <p className="story-credit">{story.source.attribution}</p>
          )}
          <details className="story-characters">
            <summary>Nhân vật trong truyện</summary>
            <ul>
              {story.characters.map((character) => (
                <li key={character.id}>
                  <strong>{character.name}:</strong> {character.description}
                </li>
              ))}
            </ul>
          </details>
          <StoryReader key={story.id} story={story} />
          <StoryDownload key={story.id} storyId={story.id} />
          <Link className="text-link" to="/stories">
            Về thư viện truyện
          </Link>
        </div>
      ) : (
        <EmptyState
          headingLevel={2}
          title={storyInterface.missingStory}
          description={storyInterface.missingStoryDescription}
          action={
            <Link className="button" to="/stories">
              Về thư viện truyện
            </Link>
          }
        />
      )}
    </>
  );
}
