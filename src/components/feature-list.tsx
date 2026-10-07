import { featureIds, type FeatureId, type FeatureUserConfig } from '@/features';
import { featureControls } from '@/features/controls';
import {
  resolveFeatures,
  type ResolvedFeatures,
  type SiteScope,
  type UserSettings,
} from '@/features/settings';
import { i18n } from '@/utils/i18n';
import { FeatureToggle } from './feature-toggle';

/** No layers beneath: a stable default. */
const NONE: readonly UserSettings[] = [];

export type OnLayerChange = (next: UserSettings, persist: boolean) => void;

/**
 * The switch and options of every feature that applies in `scope` (a site's
 * `Site.features`, or `ALL_SITES`), editing one user layer (`layer`) on
 * top of the layers `beneath` it (bottom first). Controls show the effective
 * value, and as their default what the layers beneath give.
 */
export function FeatureList({
  scope,
  beneath = NONE,
  layer,
  onChange,
}: {
  scope: SiteScope;
  beneath?: readonly UserSettings[];
  layer: UserSettings;
  /** `persist: false` updates the UI only (e.g. while dragging a slider). */
  onChange: OnLayerChange;
}) {
  const resolved = resolveFeatures(scope, ...beneath, layer);
  const defaults = resolveFeatures(scope, ...beneath);
  // `null` = the feature doesn't apply to this site; it gets no controls.
  const available = featureIds.filter((id) => resolved[id] && defaults[id]);

  if (!available.length) {
    return <p className="text-xs text-muted-foreground">{i18n.t('siteSettings.noSettings')}</p>;
  }
  return (
    <div className="flex flex-col gap-4 divide-y *:not-last:pb-4">
      {available.map((id) => (
        <FeatureSettings
          defaults={defaults}
          id={id}
          key={id}
          layer={layer}
          onChange={onChange}
          resolved={resolved}
        />
      ))}
    </div>
  );
}

/** One feature's switch and options, wired to its slice of the layer. */
function FeatureSettings<K extends FeatureId>({
  id,
  resolved,
  defaults,
  layer,
  onChange,
}: {
  id: K;
  resolved: ResolvedFeatures;
  defaults: ResolvedFeatures;
  layer: UserSettings;
  onChange: OnLayerChange;
}) {
  const { title, description, Options } = featureControls[id];
  const value = resolved[id];
  const defaultValue = defaults[id];
  if (!value || !defaultValue) return null;
  const change = (patch: FeatureUserConfig<K>, persist: boolean) =>
    onChange({ ...layer, [id]: { ...layer[id], ...patch } }, persist);
  return (
    <div className="flex flex-col gap-2">
      <FeatureToggle
        checked={value.enabled}
        description={description()}
        onCheckedChange={(enabled) => change({ enabled }, true)}
        title={title()}
      />
      {Options && <Options defaults={defaultValue} onChange={change} value={value} />}
    </div>
  );
}
