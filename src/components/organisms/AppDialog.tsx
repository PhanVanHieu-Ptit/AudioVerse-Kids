import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AccessibleButton } from '@/components/atoms/AccessibleButton';
import { Icon } from '@/components/atoms/Icon';
import { voiceGuidance } from '@/engines/audio/VoiceGuidance';
import { stopAudio } from '@/engines/audio/audioFocus';

export function AppDialog({
  open,
  title,
  description,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  description: string;
  onClose: () => void;
  children?: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const element = dialog.current;
    if (!open || !element) return;
    voiceGuidance.stop();
    stopAudio();
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    // Native modality makes the rest of the page inert. Explicit boundary
    // handling also keeps Tab from moving into browser chrome.
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const focusable = [
        ...element.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex], summary',
        ),
      ].filter(
        (node) =>
          node.tabIndex >= 0 &&
          !node.matches(':disabled') &&
          !node.closest('[inert]') &&
          node.getClientRects().length > 0,
      );
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) {
        event.preventDefault();
        element.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    element.addEventListener('keydown', trapFocus);
    element.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      element.removeEventListener('keydown', trapFocus);
      element.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected)
        previousFocus.focus({ preventScroll: true });
    };
  }, [open]);
  return createPortal(
    <dialog
      ref={dialog}
      tabIndex={-1}
      className="av-dialog"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="av-dialog__header">
        <span className="state-symbol">
          <Icon name="sound" />
        </span>
        <AccessibleButton variant="quiet" onClick={onClose}>
          Đóng
        </AccessibleButton>
      </div>
      <h2 id={`${id}-title`}>{title}</h2>
      <p id={`${id}-description`}>{description}</p>
      {children && <div className="av-dialog__body">{children}</div>}
    </dialog>,
    document.body,
  );
}
