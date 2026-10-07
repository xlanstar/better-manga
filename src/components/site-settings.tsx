import { RotateCcwIcon } from 'lucide-react';
import type { ComponentType } from 'react';
import { AccordionItem, AccordionPanel, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { featureIds, type FeatureId } from '@/features';
import {
  isCustomised,
  pruneUserSettings,
  resolveFeatures,
  type ResolvedFeatures,
  type UserSettings,
} from '@/features/settings';
import { siteHosts, type Site } from '@/sites';
import { featureControls, type ControlsPropsOf } from '@/features/controls';

type OnSettingsChange = (next: UserSettings, persist: boolean) => void;

/** One site's accordion item: its feature controls and a reset button. */
export function SiteSettings({
  site,
  userSettings,
  isCurrent,
  onChange,
}: {
  site: Site;
  userSettings: UserSettings;
  isCurrent: boolean;
  /** `persist: false` updates the UI only (e.g. while dragging a slider). */
  onChange: OnSettingsChange;
}) {
  const resolved = resolveFeatures(site.features, userSettings);
  const defaults = resolveFeatures(site.features, {});
  const customised = isCustomised(pruneUserSettings(site.features, userSettings));
  // `null` = the feature doesn't apply to this site; it gets no controls.
  const available = featureIds.filter((id) => resolved[id] && defaults[id]);

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
            {siteHosts(site).join('、')}
          </span>
        </span>
      </AccordionTrigger>

      <AccordionPanel className="flex flex-col gap-4 text-foreground">
        {available.length ? (
          available.map((id) => (
            <FeatureSettings
              defaults={defaults}
              id={id}
              key={id}
              onChange={onChange}
              resolved={resolved}
              userSettings={userSettings}
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
function FeatureSettings<K extends FeatureId>({
  id,
  resolved,
  defaults,
  userSettings,
  onChange,
}: {
  id: K;
  resolved: ResolvedFeatures;
  defaults: ResolvedFeatures;
  userSettings: UserSettings;
  onChange: OnSettingsChange;
}) {
  // TS can't correlate the map entry with `K` through JSX props on its own.
  const Controls = featureControls[id] as ComponentType<ControlsPropsOf<K>>;
  const value = resolved[id];
  const defaultValue = defaults[id];
  if (!value || !defaultValue) return null;
  return (
    <Controls
      defaults={defaultValue}
      onChange={(patch, persist) =>
        onChange({ ...userSettings, [id]: { ...userSettings[id], ...patch } }, persist)
      }
      value={value}
    />
  );
}
