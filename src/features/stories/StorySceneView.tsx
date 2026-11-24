import { useEffect, type Ref } from 'react';
import { Link } from 'react-router-dom';
import type { Story, StoryScene } from '@/types/story';
import { activityPath } from '@/types/activity';
import { StoryQuestionView } from './StoryQuestionView';
import { AudioPlayer } from '@/design-system';
import { sceneRecording, storyRecordings } from '@/content/storyAudio';
import { storyInterface } from '@/content/storyInterface';
import { audioManager } from '@/engines/audio/AudioManager';

export function StorySceneView({
  story,
  scene,
  headingRef,
}: {
  story: Story;
  scene: StoryScene;
  headingRef: Ref<HTMLHeadingElement>;
}) {
  const path = activityPath('story', story.id);
  const recording = sceneRecording(story.id, scene.id);
  useEffect(() => {
    const ownedIds = new Set(
      storyRecordings(story.id)
        .filter((item) => item.definition.sceneId === scene.id)
        .map((item) => item.resource.id),
    );
    return () => {
      if (
        ownedIds.has(
          audioManager.store.getState().channels.narration.resource?.id ?? '',
        )
      )
        audioManager.stop();
    };
  }, [story.id, scene.id]);
  return (
    <section aria-labelledby="story-scene-title" className="story-scene">
      <h2 id="story-scene-title" ref={headingRef} tabIndex={-1}>
        {scene.title}
      </h2>
      {recording ? (
        <div className="story-audio">
          <p>{storyInterface.audioInstructions}</p>
          <AudioPlayer resource={recording.resource} headingLevel={3} />
        </div>
      ) : (
        <p className="story-notice">{storyInterface.audioUnavailable}</p>
      )}
      <div className="story-transcript">
        {scene.segments.map((segment) => (
          <p key={segment.id}>
            {segment.speakerId !== 'narrator' && (
              <strong>
                {
                  story.characters.find(
                    (character) => character.id === segment.speakerId,
                  )?.name
                }
                :{' '}
              </strong>
            )}
            {segment.text}
          </p>
        ))}
      </div>
      {scene.ending && (
        <div className="story-ending">
          <h3>{scene.ending.title}</h3>
          <p>{scene.ending.message}</p>
          <p>
            <strong>Thông điệp:</strong> {story.positiveMessage}
          </p>
        </div>
      )}
      {scene.questions.map((question) => (
        <StoryQuestionView
          key={question.id}
          question={question}
          storyId={story.id}
          sceneId={scene.id}
        />
      ))}
      {scene.interaction && (
        <nav aria-label="Chọn phần tiếp theo" className="story-choices">
          <h3>{scene.interaction.prompt}</h3>
          {scene.interaction.choices.map((choice) => (
            <Link
              key={choice.id}
              className="button"
              to={`${path}?scene=${encodeURIComponent(choice.nextSceneId)}`}
            >
              {choice.label}
            </Link>
          ))}
        </nav>
      )}
      {scene.id !== story.entrySceneId && (
        <Link
          className="text-link"
          to={`${path}?scene=${encodeURIComponent(story.entrySceneId)}`}
        >
          Đọc lại từ đầu
        </Link>
      )}
    </section>
  );
}
