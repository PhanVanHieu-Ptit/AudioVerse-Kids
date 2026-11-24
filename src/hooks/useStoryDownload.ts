import { useCallback, useEffect, useRef, useState } from 'react';
import { storyRecordings } from '@/content/storyAudio';
import {
  cachedStoryFileCount,
  downloadStory,
} from '@/lib/stories/offlineStory';

export function useStoryDownload(storyId: string) {
  const resources = storyRecordings(storyId).map((item) => item.resource);
  const [status, setStatus] = useState<
    'checking' | 'available' | 'downloading' | 'ready' | 'cancelled' | 'error'
  >('checking');
  const [completed, setCompleted] = useState(0);
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    const check = new AbortController();
    void cachedStoryFileCount(
      storyRecordings(storyId).map((item) => item.resource),
    )
      .then((count) => {
        if (!check.signal.aborted) {
          setCompleted(count);
          setStatus(
            count === resources.length && count > 0 ? 'ready' : 'available',
          );
        }
      })
      .catch(() => {
        if (!check.signal.aborted) setStatus('error');
      });
    return () => {
      mounted.current = false;
      check.abort();
      controller.current?.abort();
    };
  }, [storyId, resources.length]);

  const start = useCallback(() => {
    if (controller.current) return;
    const request = new AbortController();
    controller.current = request;
    setStatus('downloading');
    void downloadStory(
      storyRecordings(storyId).map((item) => item.resource),
      request.signal,
      (count) => {
        if (mounted.current) setCompleted(count);
      },
    )
      .then(() => {
        if (mounted.current) setStatus('ready');
      })
      .catch(() => {
        if (mounted.current)
          setStatus(request.signal.aborted ? 'cancelled' : 'error');
      })
      .finally(() => {
        if (controller.current === request) controller.current = null;
      });
  }, [storyId]);
  return {
    status,
    completed,
    total: resources.length,
    bytes: resources.reduce((sum, item) => sum + item.bytes, 0),
    start,
    cancel: () => controller.current?.abort(),
  };
}
