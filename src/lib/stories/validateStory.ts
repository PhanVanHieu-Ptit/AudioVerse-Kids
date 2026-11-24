import Ajv from 'ajv';
import schema from '../../content/stories/story.schema.json' with { type: 'json' };
import type { Story } from '../../types/story.ts';

const validateShape = new Ajv({ allErrors: true, strict: true }).compile<Story>(
  schema,
);

export interface StoryValidation {
  story: Story | null;
  errors: string[];
  /** Explicit scene paths; choices never depend on an audio event or timeout. */
  paths: string[][];
}

function duplicates(ids: readonly string[], context: string): string[] {
  const seen = new Set<string>();
  const errors: string[] = [];
  for (const id of ids) {
    if (seen.has(id)) errors.push(`${context}: ID trùng ${id}`);
    seen.add(id);
  }
  return errors;
}

/** Validate structure first, then references and every possible branch. */
export function validateStory(value: unknown): StoryValidation {
  if (!validateShape(value)) {
    return {
      story: null,
      errors: (validateShape.errors ?? []).map(
        (error) =>
          `${error.instancePath || '/'}: ${error.message ?? 'Sai schema'}`,
      ),
      paths: [],
    };
  }

  const errors = [
    ...duplicates(
      value.scenes.map((scene) => scene.id),
      'Cảnh',
    ),
    ...duplicates(
      value.characters.map((character) => character.id),
      'Nhân vật',
    ),
    ...duplicates(
      value.scenes.flatMap((scene) => (scene.ending ? [scene.ending.id] : [])),
      'Kết thúc',
    ),
  ];
  const scenes = new Map(value.scenes.map((scene) => [scene.id, scene]));
  const speakers = new Set(['narrator', ...value.characters.map((c) => c.id)]);
  if (value.characters.some((c) => c.id === 'narrator'))
    errors.push('narrator là ID dành riêng cho người kể.');
  if (!scenes.has(value.entrySceneId))
    errors.push('Cảnh mở đầu không tồn tại.');

  for (const scene of value.scenes) {
    const choices = scene.interaction?.choices ?? [];
    errors.push(
      ...duplicates(
        scene.segments.map((segment) => segment.id),
        scene.id,
      ),
      ...duplicates(
        scene.soundEffects.map((effect) => effect.id),
        scene.id,
      ),
      ...duplicates(
        choices.map((choice) => choice.id),
        scene.id,
      ),
      ...duplicates(
        scene.questions.map((question) => question.id),
        scene.id,
      ),
    );
    if (Boolean(scene.ending) === Boolean(scene.interaction))
      errors.push(`${scene.id}: cần đúng một trong lựa chọn hoặc kết thúc.`);
    for (const segment of scene.segments) {
      if (!speakers.has(segment.speakerId))
        errors.push(
          `${scene.id}: người nói không tồn tại ${segment.speakerId}`,
        );
    }
    for (const effect of scene.soundEffects) {
      if (
        !scene.segments.some((segment) => segment.id === effect.anchorSegmentId)
      )
        errors.push(
          `${scene.id}: mốc hiệu ứng không tồn tại ${effect.anchorSegmentId}`,
        );
    }
    for (const choice of choices) {
      if (!scenes.has(choice.nextSceneId))
        errors.push(`${scene.id}: đích không tồn tại ${choice.nextSceneId}`);
    }
    for (const question of scene.questions) {
      errors.push(
        ...duplicates(
          question.options.map((option) => option.id),
          `${scene.id}/${question.id}`,
        ),
      );
      if (
        question.suggestedOptionId !== null &&
        !question.options.some(
          (option) => option.id === question.suggestedOptionId,
        )
      )
        errors.push(`${scene.id}: đáp án tham khảo không tồn tại.`);
    }
  }

  // Bound the traversal for externally supplied content, including convergent DAGs.
  const reached = new Set<string>();
  const active = new Set<string>();
  const complete = new Set<string>();
  function checkGraph(id: string): void {
    if (active.has(id)) {
      errors.push(`${id}: nhánh có vòng lặp.`);
      return;
    }
    if (complete.has(id)) return;
    const scene = scenes.get(id);
    if (!scene) return;
    reached.add(id);
    active.add(id);
    for (const choice of scene.interaction?.choices ?? [])
      checkGraph(choice.nextSceneId);
    active.delete(id);
    complete.add(id);
  }
  checkGraph(value.entrySceneId);
  for (const scene of value.scenes) {
    if (!reached.has(scene.id))
      errors.push(`${scene.id}: cảnh không thể tới từ mở đầu.`);
  }

  const paths: string[][] = [];
  if (errors.length === 0) {
    let traversals = 0;
    function enumerate(id: string, trail: string[]): void {
      if (++traversals > 10000) return;
      const scene = scenes.get(id);
      if (!scene) return;
      const next = [...trail, id];
      if (scene.ending) paths.push(next);
      for (const choice of scene.interaction?.choices ?? [])
        enumerate(choice.nextSceneId, next);
    }
    enumerate(value.entrySceneId, []);
    if (traversals > 10000)
      errors.push('Quá nhiều nhánh để kiểm tra toàn bộ (giới hạn 10000 lượt).');
    if (paths.length === 0) errors.push('Không có đường tới kết thúc.');
  }
  return {
    story: errors.length === 0 ? value : null,
    errors,
    paths: errors.length === 0 ? paths : [],
  };
}

export function parseStoryCollection(value: unknown): Story[] {
  if (!Array.isArray(value)) throw new Error('Danh sách truyện phải là mảng.');
  const stories: Story[] = [];
  const ids = new Set<string>();
  for (const item of value) {
    const result = validateStory(item);
    if (!result.story) throw new Error(result.errors.join('\n'));
    if (ids.has(result.story.id))
      throw new Error(`ID truyện trùng: ${result.story.id}`);
    ids.add(result.story.id);
    stories.push(result.story);
  }
  return stories;
}
