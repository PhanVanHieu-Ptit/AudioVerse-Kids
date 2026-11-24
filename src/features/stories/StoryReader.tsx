import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { EmptyState } from '@/design-system';
import { storyInterface } from '@/content/storyInterface';
import type { Story } from '@/types/story';
import { activityPath } from '@/types/activity';
import { StorySceneView } from './StorySceneView';

/** Scene URLs retain the reading position across reload and browser Back/Forward. */
export function StoryReader({ story }: { story: Story }) {
  const [params] = useSearchParams();
  const requested = params.get('scene');
  const scene = story.scenes.find(
    (item) => item.id === (requested ?? story.entrySceneId),
  );
  const path = activityPath('story', story.id);
  const heading = useRef<HTMLHeadingElement>(null);
  const previousScene = useRef(scene?.id);
  useEffect(() => {
    if (requested !== null || previousScene.current !== scene?.id)
      heading.current?.focus();
    previousScene.current = scene?.id;
  }, [requested, scene?.id]);
  if (!scene)
    return (
      <EmptyState
        headingLevel={2}
        title={storyInterface.missingScene}
        description={storyInterface.missingSceneDescription}
        action={
          <Link
            className="button"
            to={`${path}?scene=${encodeURIComponent(story.entrySceneId)}`}
            replace
          >
            Về cảnh mở đầu
          </Link>
        }
      />
    );
  return (
    <StorySceneView
      key={scene.id}
      story={story}
      scene={scene}
      headingRef={heading}
    />
  );
}
