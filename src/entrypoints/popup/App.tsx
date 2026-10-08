import { GlobeIcon, RotateCwIcon, SettingsIcon } from 'lucide-react';
import { useState } from 'react';
import { browser } from 'wxt/browser';
import { AppHeader, Section } from '@/components/page-layout';
import { ContinueReading } from '@/components/reading-history';
import { CurrentSiteSettings } from '@/components/site-settings';
import { Button } from '@/components/ui/button';
import { Frame, FramePanel } from '@/components/ui/frame';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ALL_SITES, resolveFeatures } from '@/features/settings';
import { useCurrentTab } from '@/hooks/use-current-tab';
import { useLocalePreference } from '@/hooks/use-locale';
import { useReadingHistory } from '@/hooks/use-reading-history';
import { useSettings } from '@/hooks/use-settings';
import { i18n } from '@/utils/i18n';

/**
 * The latest works read, then quick settings for the site in the current tab
 * only. The global layer, every other site and the full reading history live
 * on the options page (the header's settings button), so this stays short
 * however many sites there are.
 */
export default function App() {
  const tab = useCurrentTab();
  // Only what the popup shows: the tab's site (merged over the global layer).
  const { settings, updateSite, setDisabled } = useSettings(tab && (tab.site ? [tab.site] : []));
  // Re-render all text when the language changes.
  useLocalePreference();
  // Turning a site on (or off) only fully applies after a reload.
  const [needsReload, setNeedsReload] = useState(false);
  const history = useReadingHistory();
  if (!settings || !tab || !history) return <div className="w-85" />;

  const { site } = tab;
  const reloadTab = () => {
    if (tab.id != null) void browser.tabs.reload(tab.id).then(() => window.close());
  };

  return (
    // Browsers cap popups at 600px tall and scroll the page past that, with a
    // native scrollbar that takes width where scrollbars always show: the
    // content reflows (sliders shift under the pointer, the height changes
    // again, the scrollbar toggles) and the popup jitters. So the page never
    // overflows: the popup scrolls in a ScrollArea, at most 600px tall (its
    // viewport, which can't take a percentage of a max-height), with an
    // overlay scrollbar that takes no width. The header sticks.
    <ScrollArea className="w-85 [&>[data-slot=scroll-area-viewport]]:max-h-150">
      <AppHeader
        actions={
          <Button
            aria-label={i18n.t('popup.openOptions')}
            onClick={openOptions}
            size="icon-sm"
            title={i18n.t('popup.openOptions')}
            variant="ghost"
          >
            <SettingsIcon />
          </Button>
        }
        className="sticky top-0 z-10 flex items-center gap-2 bg-background py-3 ps-4 pe-3"
      />

      <main className="flex flex-col gap-4 px-3 pb-3">
        {/* Off for all sites: the user doesn't want it, even if a history is left. */}
        {resolveFeatures(ALL_SITES, settings.global).readingHistory?.enabled && (
          <ContinueReading history={history} />
        )}
        <Section title={i18n.t('popup.currentSite')}>
          {site ? (
            <CurrentSiteSettings
              disabled={settings.disabledSites.has(site.name)}
              global={settings.global}
              onChange={(next, persist) => updateSite(site, next, persist)}
              onDisabledChange={(disabled) => {
                setDisabled(site, disabled);
                setNeedsReload(true);
              }}
              override={settings.bySite[site.name] ?? {}}
              site={site}
            />
          ) : (
            <UnsupportedSite />
          )}
          {needsReload && (
            <div className="flex items-center justify-between gap-2 px-1 text-xs text-muted-foreground">
              {i18n.t('popup.reloadHint')}
              <Button onClick={reloadTab} size="xs" variant="outline">
                <RotateCwIcon />
                {i18n.t('popup.reload')}
              </Button>
            </div>
          )}
        </Section>
      </main>
    </ScrollArea>
  );
}

function openOptions() {
  void browser.runtime.openOptionsPage().then(() => window.close());
}

function UnsupportedSite() {
  return (
    <Frame>
      <FramePanel className="flex items-center gap-2 p-4">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <GlobeIcon className="size-4" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="text-sm font-medium">{i18n.t('popup.unsupportedSite')}</span>
          <span className="text-xs text-muted-foreground">
            {i18n.t('popup.unsupportedSiteHint')}
          </span>
        </span>
      </FramePanel>
    </Frame>
  );
}
