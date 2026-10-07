import { ChevronRightIcon, GlobeIcon, RotateCwIcon, SettingsIcon } from 'lucide-react';
import { useState } from 'react';
import { GlobalSettings } from '@/components/global-settings';
import { AppHeader, Section } from '@/components/page-layout';
import { CurrentSiteSettings } from '@/components/site-settings';
import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Frame, FramePanel } from '@/components/ui/frame';
import { useCurrentTab } from '@/hooks/use-current-tab';
import { useLocalePreference } from '@/hooks/use-locale';
import { useSettings } from '@/hooks/use-settings';
import { isCustomised } from '@/features/settings';
import { sites } from '@/sites';
import { i18n } from '@/utils/i18n';

/**
 * Quick settings: the site in the current tab, and the global layer. Managing
 * every site happens on the options page, so this stays short however many
 * sites there are.
 */
export default function App() {
  const tab = useCurrentTab();
  // Only what the popup shows: the global layer and the tab's site.
  const { settings, updateGlobal, updateSite, setDisabled } = useSettings(
    tab && (tab.site ? [tab.site] : []),
  );
  // Re-render all text when the language changes.
  useLocalePreference();
  // Turning a site on (or off) only fully applies after a reload.
  const [needsReload, setNeedsReload] = useState(false);
  if (!settings || !tab) return <div className="w-85" />;

  const { site } = tab;
  const reloadTab = () => {
    if (tab.id != null) void browser.tabs.reload(tab.id).then(() => window.close());
  };

  return (
    <div className="flex w-85 flex-col">
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
        className="flex items-center gap-2 py-3 ps-4 pe-3"
      />

      <main className="flex flex-col gap-4 px-3 pb-3">
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

        <Accordion
          className="rounded-xl border bg-background"
          // Nothing else to show on an unsupported page, so start open there.
          defaultValue={site ? [] : ['global']}
        >
          <AccordionItem value="global">
            <AccordionTrigger className="items-center px-4 py-3 hover:bg-accent/50">
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-sm font-semibold">
                  {i18n.t('globalSettings.title')}
                  {isCustomised(settings.global) && (
                    <span className="ms-1.5 inline-block size-1.5 rounded-full bg-info align-middle" />
                  )}
                </span>
                <span className="text-xs font-normal text-muted-foreground">
                  {i18n.t('globalSettings.description')}
                </span>
              </span>
            </AccordionTrigger>
            <AccordionPanel className="px-4 pt-1 text-foreground">
              <GlobalSettings global={settings.global} onChange={updateGlobal} />
            </AccordionPanel>
          </AccordionItem>
        </Accordion>

        <Button className="justify-between" onClick={openOptions} variant="outline">
          {i18n.t('popup.manageSites', [sites.length])}
          <ChevronRightIcon />
        </Button>
      </main>
    </div>
  );
}

function openOptions() {
  void browser.runtime.openOptionsPage().then(() => window.close());
}

function UnsupportedSite() {
  return (
    <Frame>
      <FramePanel className="flex items-center gap-3 p-4">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <GlobeIcon className="size-4" />
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-sm font-medium">{i18n.t('popup.unsupportedSite')}</span>
          <span className="text-xs text-muted-foreground">
            {i18n.t('popup.unsupportedSiteHint')}
          </span>
        </span>
      </FramePanel>
    </Frame>
  );
}
