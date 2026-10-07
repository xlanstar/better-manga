import { i18n } from '#i18n';
import { Accordion } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { sites } from '@/sites';
import { SiteSettings } from '@/components/site-settings';
import { usePopupSettings } from '@/hooks/use-popup-settings';

export default function App() {
  const { settings, updateSiteSettings } = usePopupSettings();
  if (!settings) return <div className="w-85" />;

  const { currentSiteName, settingsBySite } = settings;
  // The site in the current tab goes first and starts open.
  const isCurrent = (name: string) => name === currentSiteName;
  const orderedSites = sites.toSorted(
    (a, b) => Number(isCurrent(b.name)) - Number(isCurrent(a.name)),
  );

  return (
    <div className="flex w-85 flex-col">
      <header className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <div className="flex flex-col">
          <h1 className="text-sm font-semibold">{i18n.t('extName')}</h1>
          <p className="text-xs text-muted-foreground">
            {currentSiteName ? i18n.t('popup.currentSiteHint') : i18n.t('popup.unsupportedSite')}
          </p>
        </div>
        <Badge variant="outline">v{browser.runtime.getManifest().version}</Badge>
      </header>

      <Accordion className="px-4" defaultValue={currentSiteName ? [currentSiteName] : []} multiple>
        {orderedSites.map((site) => (
          <SiteSettings
            isCurrent={isCurrent(site.name)}
            key={site.name}
            onChange={(next, persist) => updateSiteSettings(site, next, persist)}
            site={site}
            userSettings={settingsBySite[site.name] ?? {}}
          />
        ))}
      </Accordion>
    </div>
  );
}
