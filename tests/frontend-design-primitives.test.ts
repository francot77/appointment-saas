import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Alert, Dialog, EmptyState, LoadingState, Status } from '../app/components/ui/feedback';

const globals = readFileSync(resolve(process.cwd(), 'app/globals.css'), 'utf8');
const render = (element: React.ReactElement) => renderToStaticMarkup(element);

describe('frontend design primitives', () => {
  it('defines product semantic tokens without changing marketing ownership', () => {
    for (const token of [
      '--color-canvas', '--color-surface', '--color-surface-muted', '--color-content',
      '--color-content-muted', '--color-border', '--color-action', '--color-focus',
      '--color-info-foreground', '--color-info-background', '--color-info-border',
      '--color-success-foreground', '--color-success-background', '--color-success-border',
      '--color-warning-foreground', '--color-warning-background', '--color-warning-border',
      '--color-danger-foreground', '--color-danger-background', '--color-danger-border',
    ]) expect(globals).toContain(token);
    expect(globals).toContain('.landing-page { --ink: #20202a; --muted: #696873; --line: #dedbd4; --indigo: #38366f; --coral: #b94735;');
    expect(globals).not.toContain('--color-success: var(--accent)');
  });

  it('preserves alert content, selected role, and optional caller actions', () => {
    const alertProps = {
      tone: 'danger', role: 'alert', retry: React.createElement('button', null, 'Retry'),
      action: React.createElement('a', { href: '/help' }, 'Help'),
    } as unknown as React.ComponentProps<typeof Alert>;
    const markup = render(React.createElement(Alert, alertProps, 'Unable to load appointments'));
    expect(markup).toContain('role="alert"');
    expect(markup).toContain('Unable to load appointments');
    expect(markup).toContain('Retry');
    expect(markup).toContain('href="/help"');
    const statusAlertProps = { tone: 'info', role: 'status' } as unknown as React.ComponentProps<typeof Alert>;
    expect(render(React.createElement(Alert, statusAlertProps, 'Saved'))).toContain('role="status"');
  });

  it('renders visible status text and only supplied descriptions', () => {
    const markup = render(React.createElement(Status, { tone: 'success', label: 'Confirmed', description: 'The appointment is ready.' }));
    expect(markup).toContain('Confirmed');
    expect(markup).toContain('The appointment is ready.');
    expect(render(React.createElement(Status, { tone: 'warning', label: 'Pending' }))).toContain('Pending');
    expect(render(React.createElement(Status, { tone: 'warning', label: 'Pending' }))).not.toContain('undefined');
  });

  it('announces loading politely and keeps empty recovery caller-controlled', () => {
    const loading = render(React.createElement(LoadingState, { label: 'Loading appointments' }));
    expect(loading).toContain('role="status"');
    expect(loading).toContain('aria-live="polite"');
    expect(loading).toContain('Loading appointments');
    const empty = render(React.createElement(EmptyState, {
      title: 'No appointments', description: 'Create one to get started.',
      action: React.createElement('button', null, 'Create appointment'),
    }));
    expect(empty).toContain('No appointments');
    expect(empty).toContain('Create one to get started.');
    expect(empty).toContain('Create appointment');
    expect(render(React.createElement(EmptyState, { title: 'Nothing here' }))).not.toContain('Create appointment');
  });

  it('renders an open labeled modal and omits closed dialog content', () => {
    const open = render(React.createElement(Dialog, {
      open: true, title: 'Cancel appointment', description: 'This cannot be undone.', closeLabel: 'Close', onClose: () => undefined,
      cancel: React.createElement('button', null, 'Keep'), confirm: React.createElement('button', null, 'Cancel'),
    }, 'Are you sure?'));
    expect(open).toContain('role="dialog"');
    expect(open).toContain('aria-modal="true"');
    expect(open).toMatch(/aria-labelledby="([^"]+)"/);
    expect(open).toMatch(/aria-describedby="([^"]+)"/);
    expect(open).toContain('Cancel appointment');
    expect(open).toContain('This cannot be undone.');
    expect(open).toContain('Keep');
    expect(open).toContain('Cancel');
    expect(render(React.createElement(Dialog, { open: false, title: 'Hidden', closeLabel: 'Close', onClose: () => undefined }))).toBe('');
  });
});
