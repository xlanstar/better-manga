import type { ReactNode } from 'react';
import { browser } from 'wxt/browser';
import logo from '@/assets/logo.svg';
import { Badge } from '@/components/ui/badge';
import { i18n } from '@/utils/i18n';
import { LanguageMenu } from './language-menu';

/** Logo, name, version and the language menu; `actions` go after it. */
export function AppHeader({ className, actions }: { className?: string; actions?: ReactNode }) {
  return (
    <header className={className}>
      <img alt="" className="size-7" src={logo} />
      <h1 className="flex-1 text-sm font-semibold">{i18n.t('extName')}</h1>
      <Badge size="sm" variant="outline">
        v{browser.runtime.getManifest().version}
      </Badge>
      <LanguageMenu />
      {actions}
    </header>
  );
}

/** A titled group of settings. */
export function Section({
  title,
  description,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex flex-col px-1">
        <h2 className="text-xs font-medium text-muted-foreground">{title}</h2>
        {description && <p className="text-xs text-muted-foreground/80">{description}</p>}
      </div>
      {children}
    </section>
  );
}
