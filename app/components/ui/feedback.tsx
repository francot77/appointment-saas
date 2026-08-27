import type { ReactNode } from 'react';
import { useId } from 'react';

export type FeedbackTone = 'info' | 'success' | 'warning' | 'danger';

export type AlertProps = {
  tone: FeedbackTone;
  role: 'alert' | 'status';
  children: ReactNode;
  retry?: ReactNode;
  action?: ReactNode;
};

export function Alert({ tone, role, children, retry, action }: AlertProps) {
  return (
    <div className={`feedback feedback-${tone}`} role={role}>
      <div>{children}</div>
      {(retry || action) && <div>{retry}{action}</div>}
    </div>
  );
}

export type StatusProps = {
  tone: FeedbackTone;
  label: string;
  description?: ReactNode;
};

export function Status({ tone, label, description }: StatusProps) {
  return (
    <div className={`status status-${tone}`}>
      <strong>{label}</strong>
      {description && <div>{description}</div>}
    </div>
  );
}

export type LoadingStateProps = { label: string };

export function LoadingState({ label }: LoadingStateProps) {
  return <div role="status" aria-live="polite">{label}</div>;
}

export type EmptyStateProps = {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  const id = useId();
  const titleId = `empty-state-title-${id}`;

  return (
    <section className="empty-state" aria-labelledby={titleId}>
      <h2 id={titleId}>{title}</h2>
      {description && <div>{description}</div>}
      {action && <div>{action}</div>}
    </section>
  );
}

export type DialogProps = {
  open: boolean;
  title: string;
  description?: ReactNode;
  closeLabel: string;
  onClose: () => void;
  children?: ReactNode;
  cancel?: ReactNode;
  confirm?: ReactNode;
};

export function Dialog({ open, title, description, closeLabel, onClose, children, cancel, confirm }: DialogProps) {
  const id = useId();
  const titleId = `dialog-title-${id}`;
  const descriptionId = `dialog-description-${id}`;

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby={titleId} {...(description ? { 'aria-describedby': descriptionId } : {})}>
      <button type="button" aria-label={closeLabel} onClick={onClose}>{closeLabel}</button>
      <h2 id={titleId}>{title}</h2>
      {description && <div id={descriptionId}>{description}</div>}
      {children && <div>{children}</div>}
      {(cancel || confirm) && <div>{cancel}{confirm}</div>}
    </div>
  );
}
