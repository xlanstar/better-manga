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
    <Label className="justify-between gap-4">
      <span className="flex items-center gap-2">
        {title}
        <InfoTooltip description={description} />
      </span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </Label>
  );
}
