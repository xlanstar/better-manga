import { SearchIcon, SearchXIcon } from 'lucide-react';
import { useDeferredValue, useState } from 'react';
import { GlobalSettings } from '@/components/global-settings';
import { AppHeader, Section } from '@/components/page-layout';
import {
  isSiteCustomised,
  SiteSettingsItem,
  type SiteSettingsProps,
} from '@/components/site-settings';
import { Accordion } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Frame, FramePanel } from '@/components/ui/frame';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useLocalePreference } from '@/hooks/use-locale';
import { useSettings } from '@/hooks/use-settings';
import { siteMatchesQuery, sites } from '@/sites';
import { i18n } from '@/utils/i18n';

const FILTERS = ['all', 'customised', 'disabled'] as const;
type Filter = (typeof FILTERS)[number];

/** Sites rendered at first, and added per "show more". */
const PAGE_SIZE = 50;

/** Every site's settings: the global layer, then a searchable site list. */
export default function App() {
  const { settings, updateGlobal, updateSite, setDisabled } = useSettings();
  useLocalePreference();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [limit, setLimit] = useState(PAGE_SIZE);
  // Keep typing responsive with many sites.
  const deferredQuery = useDeferredValue(query);
  if (!settings) return null;

  const propsFor = (site: (typeof sites)[number]): SiteSettingsProps => ({
    site,
    global: settings.global,
    override: settings.bySite[site.name] ?? {},
    disabled: settings.disabledSites.has(site.name),
    onChange: (next, persist) => updateSite(site, next, persist),
    onDisabledChange: (disabled) => setDisabled(site, disabled),
  });
  const all = sites.map(propsFor);
  const counts: Record<Filter, number> = {
    all: all.length,
    customised: all.filter(isSiteCustomised).length,
    disabled: all.filter((p) => p.disabled).length,
  };
  const matching = all.filter(
    (p) =>
      (filter === 'all' || (filter === 'customised' ? isSiteCustomised(p) : p.disabled)) &&
      siteMatchesQuery(p.site, deferredQuery),
  );
  const shown = matching.slice(0, limit);
  const filterLabels: Record<Filter, string> = {
    all: i18n.t('options.filterAll'),
    customised: i18n.t('options.filterCustomised'),
    disabled: i18n.t('options.filterDisabled'),
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
      <AppHeader className="flex items-center gap-2 px-1" />

      <Section
        description={i18n.t('globalSettings.description')}
        title={i18n.t('globalSettings.title')}
      >
        <Frame>
          <FramePanel className="p-4">
            <GlobalSettings global={settings.global} onChange={updateGlobal} />
          </FramePanel>
        </Frame>
      </Section>

      <Section description={i18n.t('options.sitesDescription')} title={i18n.t('options.sites')}>
        <div className="flex items-center gap-2">
          <InputGroup className="flex-1">
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              aria-label={i18n.t('options.search')}
              onChange={(e) => {
                setQuery(e.currentTarget.value);
                setLimit(PAGE_SIZE);
              }}
              placeholder={i18n.t('options.search')}
              type="search"
              value={query}
            />
          </InputGroup>
          <ToggleGroup
            onValueChange={(value) => {
              const next = FILTERS.find((f) => value.includes(f));
              if (next) setFilter(next);
              setLimit(PAGE_SIZE);
            }}
            size="sm"
            value={[filter]}
            variant="outline"
          >
            {FILTERS.map((f) => (
              <ToggleGroupItem key={f} value={f}>
                {filterLabels[f]}
                <span className="text-xs text-muted-foreground tabular-nums">{counts[f]}</span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        {shown.length ? (
          <Accordion className="overflow-hidden rounded-xl border bg-background" multiple>
            {shown.map((props) => (
              <SiteSettingsItem key={props.site.name} {...props} />
            ))}
          </Accordion>
        ) : (
          <Empty className="rounded-xl border border-dashed py-10 md:py-10">
            <EmptyMedia variant="icon">
              <SearchXIcon />
            </EmptyMedia>
            <EmptyTitle className="text-sm">{i18n.t('options.noResults')}</EmptyTitle>
            <EmptyDescription className="text-xs">
              {i18n.t('options.noResultsHint')}
            </EmptyDescription>
          </Empty>
        )}

        {matching.length > shown.length && (
          <Button onClick={() => setLimit((n) => n + PAGE_SIZE)} variant="outline">
            {i18n.t('options.showMore', [matching.length - shown.length])}
          </Button>
        )}
      </Section>
    </div>
  );
}
