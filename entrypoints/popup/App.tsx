import { RotateCcwIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { sites, sitesFor, type Site } from '@/entrypoints/content/sites';
import {
  PAGE_SCROLL_RATIO,
  isCustomised,
  loadUserSettings,
  pruneUserSettings,
  resetUserSettings,
  resolveFeatures,
  saveUserSettings,
  type PageScrollResolved,
  type UserSiteSettings,
} from '@/utils/settings';

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
  const ordered = [...sites].sort(
    (a, b) => Number(b.name === current) - Number(a.name === current),
  );

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
        {features.pageScroll && defaults.pageScroll ? (
          <PageScrollControls
            defaults={defaults.pageScroll}
            onChange={(patch, persist) =>
              onChange({ ...user, pageScroll: { ...user.pageScroll, ...patch } }, persist)
            }
            value={features.pageScroll}
          />
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

function PageScrollControls({
  value,
  defaults,
  onChange,
}: {
  value: PageScrollResolved;
  defaults: PageScrollResolved;
  onChange: (patch: Partial<PageScrollResolved>, persist: boolean) => void;
}) {
  // Slider steps are floats; keep stored values clean so they compare equal.
  // The coss Slider is typed for ranges too; this one has a single thumb.
  const round = (v: number | readonly number[]) =>
    Math.round((typeof v === 'number' ? v : (v[0] ?? defaults.ratio)) * 100) / 100;

  return (
    <div className="flex flex-col gap-3">
      <Label className="items-start justify-between gap-3">
        <span className="flex flex-col gap-1">
          Page Up / Down 捲動
          <span className="text-xs font-normal text-muted-foreground">
            每次捲動畫面高度的固定比例，保留重疊方便接續閱讀。
          </span>
        </span>
        <Switch
          checked={value.enabled}
          onCheckedChange={(enabled) => onChange({ enabled }, true)}
        />
      </Label>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">捲動比例</span>
          <span className="font-medium tabular-nums">{percent(value.ratio)}</span>
        </div>
        <Slider
          aria-label="捲動比例"
          disabled={!value.enabled}
          max={PAGE_SCROLL_RATIO.max}
          min={PAGE_SCROLL_RATIO.min}
          onValueChange={(v) => onChange({ ratio: round(v) }, false)}
          onValueCommitted={(v) => onChange({ ratio: round(v) }, true)}
          step={PAGE_SCROLL_RATIO.step}
          value={value.ratio}
        />
        <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
          <span>{percent(PAGE_SCROLL_RATIO.min)}</span>
          <span>預設 {percent(defaults.ratio)}</span>
          <span>{percent(PAGE_SCROLL_RATIO.max)}</span>
        </div>
      </div>
    </div>
  );
}

const percent = (ratio: number) => `${Math.round(ratio * 100)}%`;

/** `*://*.baozimh.org/*` → `baozimh.org` */
function siteHosts(site: Site): string {
  const hosts = site.matches.map((p) =>
    p
      .replace(/^[^:]+:\/\//, '')
      .replace(/^\*\./, '')
      .replace(/\/.*$/, ''),
  );
  return [...new Set(hosts)].join('、');
}
