import { HistoryIcon, Trash2Icon, XIcon } from 'lucide-react';
import { useState } from 'react';
import { browser } from 'wxt/browser';
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Frame, FramePanel } from '@/components/ui/frame';
import { workKey, type HistoryEntry } from '@/features/reading-history/history';
import { clearHistory, removeEntry } from '@/features/reading-history/storage';
import { sites } from '@/sites';
import { formatTimeAgo } from '@/utils/format';
import { i18n } from '@/utils/i18n';
import { Section } from './page-layout';

/** Entries the popup shows. */
const POPUP_ENTRIES = 3;

/** Entries the options page renders at first, and adds per "show more". */
const PAGE_SIZE = 50;

/**
 * The popup's latest few entries; clicking one opens its chapter in the
 * current tab. Nothing when the history is empty.
 */
export function ContinueReading({ history }: { history: readonly HistoryEntry[] }) {
  // "5 minutes ago" as of opening; the popup is short-lived.
  const [now] = useState(Date.now);
  if (!history.length) return null;
  return (
    <Section title={i18n.t('readingHistory.continue')}>
      <Frame>
        <FramePanel className="flex flex-col p-1">
          {history.slice(0, POPUP_ENTRIES).map((entry) => (
            <button
              className="flex rounded-lg px-3 py-2 text-start hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
              key={workKey(entry)}
              onClick={() =>
                void browser.tabs.update({ url: entry.url }).then(() => window.close())
              }
              type="button"
            >
              <EntrySummary entry={entry} now={now} />
            </button>
          ))}
        </FramePanel>
      </Frame>
    </Section>
  );
}

/**
 * The options page's full history, a page at a time: each entry opens its
 * chapter in a new tab and can be removed; the whole history can be cleared.
 */
export function ReadingHistory({ history }: { history: readonly HistoryEntry[] }) {
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [now] = useState(Date.now);
  const shown = history.slice(0, limit);
  return (
    <Section
      description={i18n.t('readingHistory.listDescription')}
      title={i18n.t('readingHistory.title')}
    >
      {shown.length ? (
        <div className="flex flex-col divide-y overflow-hidden rounded-xl border bg-background">
          {shown.map((entry) => (
            <div className="flex items-center gap-2 py-2 ps-4 pe-2" key={workKey(entry)}>
              <a
                className="flex min-w-0 flex-1 hover:underline"
                href={entry.url}
                rel="noreferrer"
                target="_blank"
              >
                <EntrySummary entry={entry} now={now} />
              </a>
              <Button
                aria-label={i18n.t('readingHistory.remove')}
                onClick={() => void removeEntry(entry)}
                size="icon-sm"
                title={i18n.t('readingHistory.remove')}
                variant="ghost"
              >
                <XIcon />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <Empty className="rounded-xl border border-dashed py-10 md:py-10">
          <EmptyMedia variant="icon">
            <HistoryIcon />
          </EmptyMedia>
          <EmptyTitle className="text-sm">{i18n.t('readingHistory.empty')}</EmptyTitle>
          <EmptyDescription className="text-xs">
            {i18n.t('readingHistory.emptyHint')}
          </EmptyDescription>
        </Empty>
      )}

      {history.length > shown.length && (
        <Button onClick={() => setLimit((n) => n + PAGE_SIZE)} variant="outline">
          {i18n.t('options.showMore', [history.length - shown.length])}
        </Button>
      )}
      {history.length > 0 && (
        <div className="flex justify-end">
          <ClearHistoryButton />
        </div>
      )}
    </Section>
  );
}

/** "Clear history", after a confirmation. */
function ClearHistoryButton() {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button size="xs" variant="ghost" />}>
        <Trash2Icon />
        {i18n.t('readingHistory.clear')}
      </AlertDialogTrigger>
      <AlertDialogPopup>
        <AlertDialogHeader>
          <AlertDialogTitle>{i18n.t('readingHistory.clearTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {i18n.t('readingHistory.clearDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="ghost" />}>
            {i18n.t('readingHistory.cancel')}
          </AlertDialogClose>
          <AlertDialogClose
            onClick={() => void clearHistory()}
            render={<Button variant="destructive" />}
          >
            {i18n.t('readingHistory.clearConfirm')}
          </AlertDialogClose>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  );
}

/** The work, then the chapter, site and when it was read. */
function EntrySummary({ entry, now }: { entry: HistoryEntry; now: number }) {
  const site = sites.find((s) => s.name === entry.site)?.label ?? entry.site;
  const ago = formatTimeAgo(entry.updatedAt, now, i18n.t('lang'));
  return (
    <span className="flex min-w-0 flex-1 flex-col">
      <span className="truncate text-sm font-medium">{entry.workTitle}</span>
      <span className="truncate text-xs text-muted-foreground">
        {i18n.t('readingHistory.entryDetail', [entry.chapterTitle, site, ago])}
      </span>
    </span>
  );
}
