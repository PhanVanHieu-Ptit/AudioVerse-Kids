import { useId, useState } from 'react';
import { AccessibleButton } from '@/design-system';
import type { StoryQuestion } from '@/types/story';
import { questionRecording } from '@/content/storyAudio';
import { StoryClipButton } from './StoryClipButton';
import { audioManager } from '@/engines/audio/AudioManager';

export function StoryQuestionView({
  question,
  storyId,
  sceneId,
}: {
  question: StoryQuestion;
  storyId: string;
  sceneId: string;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const description = useId();
  const feedback = question.options.find(
    (option) => option.id === selected,
  )?.feedback;
  return (
    <fieldset className="story-question" aria-describedby={description}>
      <legend>{question.prompt}</legend>
      <p id={description}>
        Câu hỏi tùy chọn. Em có thể chọn phần tiếp theo mà không trả lời.
      </p>
      <StoryClipButton
        recording={questionRecording(storyId, sceneId, question.id)}
        label="Nghe câu hỏi"
      />
      <div className="story-question-options">
        {question.options.map((option) => (
          <AccessibleButton
            key={option.id}
            variant="secondary"
            aria-pressed={selected === option.id}
            onClick={() => {
              audioManager.pause();
              setSelected(option.id);
            }}
          >
            {option.label}
          </AccessibleButton>
        ))}
      </div>
      <p role="status" aria-label="Phản hồi câu hỏi">
        {feedback ?? ''}
      </p>
      {selected && (
        <StoryClipButton
          key={selected}
          recording={questionRecording(storyId, sceneId, question.id, selected)}
          label="Nghe phản hồi"
        />
      )}
    </fieldset>
  );
}
