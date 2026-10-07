import type { ComponentType } from 'react';
import { featureIds, type FeatureId } from '@/features';
import { featureControls, type ControlsPropsOf } from '@/features/controls';
import {
  resolveFeatures,
  type ResolvedFeatures,
  type SiteFeatures,
  type UserSettings,
} from '@/features/settings';
import { i18n } from '@/utils/i18n';

/** No layers beneath: a stable default. */
const NONE: readonly UserSettings[] = [];

export type OnLayerChange = (next: UserSettings, persist: boolean) => void;

/**
 * The controls of every feature that applies, editing one user layer (`layer`)
 * on top of the layers `beneath` it (bottom first). Controls show the
 * effective value, and as their default what the layers beneath give.
 */
export function FeatureList({
  siteFeatures,
  beneath = NONE,
  layer,
  onChange,
}: {
  siteFeatures?: SiteFeatures;
  beneath?: readonly UserSettings[];
  layer: UserSettings;
  /** `persist: false` updates the UI only (e.g. while dragging a slider). */
  onChange: OnLayerChange;
}) {
  const resolved = resolveFeatures(siteFeatures, ...beneath, layer);
  const defaults = resolveFeatures(siteFeatures, ...beneath);
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

/** One feature's controls, wired to its slice of the layer. */
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
  // TS can't correlate the map entry with `K` through JSX props on its own.
  const Controls = featureControls[id] as ComponentType<ControlsPropsOf<K>>;
  const value = resolved[id];
  const defaultValue = defaults[id];
  if (!value || !defaultValue) return null;
  return (
    <Controls
      defaults={defaultValue}
      onChange={(patch, persist) =>
        onChange({ ...layer, [id]: { ...layer[id], ...patch } }, persist)
      }
      value={value}
    />
  );
}
