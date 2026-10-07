import { RotateCcwIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ALL_SITES, isCustomised, type UserSettings } from '@/features/settings';
import { i18n } from '@/utils/i18n';
import { FeatureList, type OnLayerChange } from './feature-list';

/** The user layer for all sites, with a reset to the built-in defaults. */
export function GlobalSettings({
  global,
  onChange,
}: {
  global: UserSettings;
  onChange: OnLayerChange;
}) {
  return (
    <div className="flex flex-col gap-4">
      <FeatureList layer={global} onChange={onChange} scope={ALL_SITES} />
      {isCustomised(global) && (
        <div className="flex justify-end">
          <Button onClick={() => onChange({}, true)} size="xs" variant="ghost">
            <RotateCcwIcon />
            {i18n.t('globalSettings.reset')}
          </Button>
        </div>
      )}
    </div>
  );
}
