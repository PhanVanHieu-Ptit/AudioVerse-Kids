import { useId, type ReactNode } from 'react';
import { AppCard } from './AppCard';
import {
  AudioButton,
  type AudioButtonProps,
} from '@/components/atoms/AudioButton';

interface AudioCardProps extends Omit<AudioButtonProps, 'describedBy'> {
  description: string;
  metadata?: string;
  transcript?: string;
  feedback?: ReactNode;
}

export function AudioCard({
  title,
  description,
  metadata,
  transcript,
  feedback,
  ...control
}: AudioCardProps) {
  const id = useId();
  return (
    <AppCard title={title} description={description} icon="sound" tone="teal">
      {metadata && <p className="audio-metadata">{metadata}</p>}
      <AudioButton {...control} title={title} describedBy={id} />
      <p id={id} className="audio-feedback" role="status">
        {feedback ??
          (control.state === 'unavailable'
            ? 'Âm thanh chưa được cung cấp.'
            : '')}
      </p>
      {transcript && (
        <details className="audio-transcript">
          <summary>Nội dung bằng chữ</summary>
          <p>{transcript}</p>
        </details>
      )}
    </AppCard>
  );
}
