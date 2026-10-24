import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { useMemo, type ReactNode } from 'react';
import { previewMarkdown, type Output } from '@livebio/core';

interface Props {
  output: Output;
  mode: 'dark' | 'light';
  title: string;
  /** Controls shown in the window's title bar, such as a button to choose this design. */
  actions?: ReactNode;
}

/** A README as GitHub would draw it, in a window. Used where two designs are shown side by side. */
export function ReadmeWindow({ output, mode, title, actions }: Props) {
  // Profile text comes from other people's GitHub accounts, so the HTML is always sanitised.
  const html = useMemo(() => DOMPurify.sanitize(marked.parse(previewMarkdown(output, mode), { async: false })), [output, mode]);
  return (
    <div className={`window ${mode}`}>
      <div className="window-bar">
        <span className="dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="window-path">{title}</span>
        {actions}
      </div>
      <article className="readme" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
