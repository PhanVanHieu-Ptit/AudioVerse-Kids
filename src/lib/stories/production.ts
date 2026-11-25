import type { Story, StoryScene } from '../../types/story.ts';

export interface SpeechCue {
  id: string;
  storyId: string;
  sceneId: string | null;
  kind: 'speech';
  locale: 'vi-VN';
  status: 'planned';
  targetFile: string;
  role:
    | 'title'
    | 'introduction'
    | 'source-credit'
    | 'character'
    | 'scene-title'
    | 'narration'
    | 'dialogue'
    | 'interaction'
    | 'question'
    | 'feedback'
    | 'ending'
    | 'message';
  speakerId: string;
  text: string;
}

export interface EffectCue {
  id: string;
  storyId: string;
  sceneId: string;
  kind: 'sound-effect';
  locale: 'vi-VN';
  status: 'planned';
  targetFile: string;
  description: string;
  anchorSegmentId: string;
  placement: 'before' | 'after';
  productionNotes: string;
}

export type StoryAssetPlan = SpeechCue | EffectCue;

/** A plan has a targetFile, never a playable src or invented duration/bytes. */
export function planStoryAssets(story: Story): StoryAssetPlan[] {
  const assets: StoryAssetPlan[] = [];
  function speech(
    suffix: string,
    role: SpeechCue['role'],
    text: string,
    sceneId: string | null = null,
    speakerId = 'narrator',
  ) {
    const id = `${story.id}.${suffix}`;
    assets.push({
      id,
      storyId: story.id,
      sceneId,
      kind: 'speech',
      locale: 'vi-VN',
      status: 'planned',
      targetFile: `audio/stories/${story.id}/${id}.v1.mp3`,
      role,
      speakerId,
      text,
    });
  }
  speech('title', 'title', story.title);
  speech('introduction', 'introduction', story.introduction);
  if (story.source)
    speech('source-credit', 'source-credit', story.source.attribution);
  for (const character of story.characters)
    speech(
      `character.${character.id}`,
      'character',
      `${character.name}. ${character.description}`,
    );
  for (const scene of story.scenes) {
    speech(`scene.${scene.id}.title`, 'scene-title', scene.title, scene.id);
    for (const segment of scene.segments)
      speech(
        `scene.${scene.id}.segment.${segment.id}`,
        segment.speakerId === 'narrator' ? 'narration' : 'dialogue',
        segment.text,
        scene.id,
        segment.speakerId,
      );
    if (scene.interaction)
      speech(
        `scene.${scene.id}.interaction`,
        'interaction',
        [
          scene.interaction.prompt,
          ...scene.interaction.choices.map(
            (choice, index) => `Lựa chọn ${index + 1}. ${choice.label}`,
          ),
        ].join('\n'),
        scene.id,
      );
    for (const question of scene.questions) {
      speech(
        `scene.${scene.id}.question.${question.id}`,
        'question',
        [
          question.prompt,
          ...question.options.map(
            (option, index) => `Lựa chọn ${index + 1}. ${option.label}`,
          ),
        ].join('\n'),
        scene.id,
      );
      for (const option of question.options)
        speech(
          `scene.${scene.id}.question.${question.id}.feedback.${option.id}`,
          'feedback',
          option.feedback,
          scene.id,
        );
    }
    if (scene.ending)
      speech(
        `scene.${scene.id}.ending`,
        'ending',
        `${scene.ending.title}. ${scene.ending.message}`,
        scene.id,
      );
    for (const effect of scene.soundEffects) {
      const id = `${story.id}.scene.${scene.id}.effect.${effect.id}`;
      assets.push({
        id,
        storyId: story.id,
        sceneId: scene.id,
        kind: 'sound-effect',
        locale: 'vi-VN',
        status: 'planned',
        targetFile: `audio/stories/${story.id}/${id}.v1.wav`,
        description: effect.description,
        anchorSegmentId: effect.anchorSegmentId,
        placement: effect.placement,
        productionNotes: effect.productionNotes,
      });
    }
  }
  speech('message', 'message', story.positiveMessage);
  return assets;
}

export function speakerName(story: Story, id: string): string {
  if (id === 'narrator') return 'Người kể';
  const character = story.characters.find((candidate) => candidate.id === id);
  if (!character) throw new Error(`Người nói không tồn tại: ${id}`);
  return character.name;
}

function sceneTranscript(story: Story, scene: StoryScene): string[] {
  const lines = [`## ${scene.title}`, '', `Mã cảnh: ${scene.id}.`, ''];
  for (const segment of scene.segments) {
    const effects = scene.soundEffects.filter(
      (effect) => effect.anchorSegmentId === segment.id,
    );
    const effectsAt = (placement: 'before' | 'after') =>
      effects
        .filter((effect) => effect.placement === placement)
        .map(
          (effect) =>
            `[Hiệu ứng đề xuất, chưa có tệp: ${effect.description}]\n`,
        );
    lines.push(
      ...effectsAt('before'),
      `**${speakerName(story, segment.speakerId)}:** ${segment.text}`,
      '',
      ...effectsAt('after'),
    );
  }
  if (scene.interaction) {
    lines.push(`**Lựa chọn:** ${scene.interaction.prompt}`, '');
    for (const choice of scene.interaction.choices) {
      const destination = story.scenes.find(
        (candidate) => candidate.id === choice.nextSceneId,
      );
      if (!destination)
        throw new Error(`Đích không tồn tại: ${choice.nextSceneId}`);
      lines.push(
        `- ${choice.label} → [${destination.title}](#${destination.id}) (mã: ${destination.id}).`,
      );
    }
    lines.push('');
  }
  for (const question of scene.questions) {
    lines.push(`**Câu hỏi tùy chọn:** ${question.prompt}`, '');
    for (const option of question.options)
      lines.push(`- ${option.label} — Phản hồi: ${option.feedback}`);
    lines.push(
      '',
      question.suggestedOptionId === null
        ? 'Câu hỏi suy ngẫm: không có đáp án được ưu tiên.'
        : `Đáp án tham khảo: ${question.options.find((option) => option.id === question.suggestedOptionId)?.label ?? ''}`,
      '',
    );
  }
  if (scene.ending)
    lines.push(
      `**Kết thúc: ${scene.ending.title}.** ${scene.ending.message}`,
      '',
    );
  return lines;
}

/** Full branch transcript, explicitly not a linear autoplay reading order. */
export function renderStoryTranscript(story: Story): string {
  const lines = [
    `# ${story.title}`,
    '',
    story.introduction,
    '',
    `Cấp độ: ${story.level}. Ngôn ngữ: tiếng Việt.`,
    '',
    'Đây là bản chữ đầy đủ của mọi nhánh. Bắt đầu ở cảnh mở đầu và theo lựa chọn; không đọc nối tất cả các kết thúc như một mạch truyện. Có thể bỏ qua câu hỏi, đọc lại hoặc dừng bất kỳ lúc nào. Mọi hiệu ứng dưới đây đều là đề xuất chưa sản xuất.',
    '',
    '## Nhân vật',
    '',
    ...story.characters.map(
      (character) => `- **${character.name}:** ${character.description}`,
    ),
    '',
    `Cảnh mở đầu: [${story.entrySceneId}](#${story.entrySceneId}).`,
    '',
  ];
  if (story.source) {
    lines.push(
      '## Xuất xứ và bản kể',
      '',
      story.source.attribution,
      '',
      `Nguồn đối chiếu: [${story.source.title}](${story.source.referenceUrl}).`,
      '',
      story.source.rightsNote,
      '',
      `Ngày rà soát nguồn: ${story.source.reviewedOn}.`,
      '',
      ...story.source.adaptationNotes.map((note) => `- ${note}`),
      '',
      'Tham chiếu quyền sử dụng:',
      '',
      ...story.source.rightsReferences.map(
        (url, index) => `- [Nguồn ${index + 1}](${url}).`,
      ),
      '',
    );
  }
  for (const scene of story.scenes) {
    lines.push(
      `<a id="${scene.id}"></a>`,
      '',
      ...sceneTranscript(story, scene),
    );
  }
  lines.push(
    '## Thông điệp tích cực',
    '',
    story.positiveMessage,
    '',
    '## Ghi chú tiếp cận',
    '',
    ...story.accessibilityNotes.map((note) => `- ${note}`),
    '',
  );
  return lines.join('\n');
}
