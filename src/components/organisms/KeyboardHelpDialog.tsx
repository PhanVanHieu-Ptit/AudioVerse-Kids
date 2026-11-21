import { AppDialog } from './AppDialog';
import {
  audioShortcuts,
  controlBarLabels as labels,
} from '@/content/audioControls';
import { keyboardHelp } from '@/content/accessibility';

export interface KeyboardHelpDialogProps {
  open: boolean;
  onClose: () => void;
}

export function KeyboardHelpDialog({ open, onClose }: KeyboardHelpDialogProps) {
  return (
    <AppDialog
      open={open}
      onClose={onClose}
      title={labels.help}
      description={labels.helpDescription}
    >
      <p>{labels.sequential}</p>
      <dl className="keyboard-help">
        {keyboardHelp.map(({ keys, action }) => (
          <div key={keys}>
            <dt>
              <kbd>{keys}</kbd>
            </dt>
            <dd>{action}</dd>
          </div>
        ))}
      </dl>
      <p>{labels.scope}</p>
      <dl className="keyboard-help">
        {audioShortcuts.map(({ key, label }) => (
          <div key={key}>
            <dt>
              <kbd>{key.toUpperCase()}</kbd>
            </dt>
            <dd>{label}</dd>
          </div>
        ))}
      </dl>
      <p>{labels.navigationHint}</p>
    </AppDialog>
  );
}
