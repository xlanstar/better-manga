import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { InfoTooltip } from './info-tooltip';

/** A feature's title, with its description in a tooltip, and its on/off switch. */
export function FeatureToggle({
  title,
  description,
  checked,
  onCheckedChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    // Same size in the narrow popup as on the options page (Label grows below `sm`).
    <Label className="justify-between gap-4 text-sm sm:text-sm">
      <span className="flex items-center gap-2">
        {title}
        <InfoTooltip description={description} />
      </span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </Label>
  );
}
