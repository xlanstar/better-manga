import { RotateCcwIcon } from 'lucide-react';
import { useEffect, useState, type ComponentType } from 'react';
import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { featureIds, type FeatureId } from '@/features';
import { siteHosts, sites, sitesFor, type Site } from '@/sites';
import {
  isCustomised,
  loadUserSettings,
  pruneUserSettings,
  resetUserSettings,
  resolveFeatures,
  saveUserSettings,
  type ResolvedFeatures,
  type UserSiteSettings,
} from '@/utils/settings';
import { featureControls, type FeatureControlsProps } from './features';

type UserBySite = Record<string, UserSiteSettings>;

export default function App() {
  const [current, setCurrent] = useState<string | null>(null);
  const [users, setUsers] = useState<UserBySite | null>(null);

  useEffect(() => {
    (async () => {
      // `activeTab` exposes the URL of the tab the popup was opened on.
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true }).catch(() => []);
      setCurrent((tab?.url && sitesFor(tab.url)[0]?.name) || null);
      const loaded = await Promise.all(
        sites.map(async (s) => [s.name, await loadUserSettings(s.name).catch(() => ({}))] as const),
      );
      setUsers(Object.fromEntries(loaded));
    })();
  }, []);

  if (!users) return <div className="w-85" />;

  // The site in the current tab goes first and starts open.
  const ordered = sites.toSorted((a, b) => Number(b.name === current) - Number(a.name === current));

  const update = (site: Site, next: UserSiteSettings, persist: boolean) => {
    const pruned = persist ? pruneUserSettings(site.features, next) : next;
    setUsers((prev) => ({ ...prev, [site.name]: pruned }));
    if (!persist) return;
    void (isCustomised(pruned)
      ? saveUserSettings(site.name, pruned)
      : resetUserSettings(site.name));
  };

  return (
    <div className="flex w-85 flex-col">
      <header className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <div className="flex flex-col">
          <h1 className="text-sm font-semibold">Better Manga</h1>
          <p className="text-xs text-muted-foreground">
            {current ? '調整此網站或其他支援網站的設定' : '目前分頁不是支援的網站'}
          </p>
        </div>
        <Badge variant="outline">v{browser.runtime.getManifest().version}</Badge>
      </header>

      <Accordion className="px-4" defaultValue={current ? [current] : []} multiple>
        {ordered.map((site) => (
          <SiteItem
            isCurrent={site.name === current}
            key={site.name}
            onChange={(next, persist) => update(site, next, persist)}
            site={site}
            user={users[site.name] ?? {}}
          />
        ))}
      </Accordion>
    </div>
  );
}

function SiteItem({
  site,
  user,
  isCurrent,
  onChange,
}: {
  site: Site;
  user: UserSiteSettings;
  isCurrent: boolean;
  /** `persist: false` updates the UI only (e.g. while dragging a slider). */
  onChange: (next: UserSiteSettings, persist: boolean) => void;
}) {
  const features = resolveFeatures(site.features, user);
  const defaults = resolveFeatures(site.features, {});
  const customised = isCustomised(pruneUserSettings(site.features, user));
  // `null` = the feature doesn't apply to this site; it gets no controls.
  const available = featureIds.filter((id) => features[id] && defaults[id]);

  return (
    <AccordionItem value={site.name}>
      <AccordionTrigger>
        <span className="flex min-w-0 flex-col gap-1">
          <span className="flex items-center gap-1.5">
            {site.label}
            {isCurrent && (
              <Badge size="sm" variant="info">
                目前頁面
              </Badge>
            )}
            {customised && (
              <Badge size="sm" variant="secondary">
                已自訂
              </Badge>
            )}
          </span>
          <span className="truncate text-xs font-normal text-muted-foreground">
            {siteHosts(site)}
          </span>
        </span>
      </AccordionTrigger>

      <AccordionPanel className="flex flex-col gap-4 text-foreground">
        {available.length ? (
          available.map((id) => (
            <FeatureItem
              defaults={defaults}
              id={id}
              key={id}
              onChange={onChange}
              user={user}
              value={features}
            />
          ))
        ) : (
          <p className="text-muted-foreground">此網站沒有可調整的設定，網站修正會自動套用。</p>
        )}

        <div className="flex justify-end">
          <Button
            disabled={!customised}
            onClick={() => onChange({}, true)}
            size="xs"
            variant="ghost"
          >
            <RotateCcwIcon />
            還原預設
          </Button>
        </div>
      </AccordionPanel>
    </AccordionItem>
  );
}

/** One feature's controls, wired to its slice of the site's settings. */
function FeatureItem<K extends FeatureId>({
  id,
  value,
  defaults,
  user,
  onChange,
}: {
  id: K;
  value: ResolvedFeatures;
  defaults: ResolvedFeatures;
  user: UserSiteSettings;
  onChange: (next: UserSiteSettings, persist: boolean) => void;
}) {
  // TS can't correlate the map entry with `K` through JSX props on its own.
  const Controls = featureControls[id] as ComponentType<FeatureControlsProps<K>>;
  const current = value[id];
  const base = defaults[id];
  if (!current || !base) return null;
  return (
    <Controls
      defaults={base}
      onChange={(patch, persist) => onChange({ ...user, [id]: { ...user[id], ...patch } }, persist)}
      value={current}
    />
  );
}
