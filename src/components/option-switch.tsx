import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { InfoTooltip } from './info-tooltip';

/** A feature option as a switch, with its label and what it does in a tooltip. */
export function OptionSwitch({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <Label className="justify-between gap-4 text-xs font-normal sm:text-xs">
      <span className="flex items-center gap-2">
        {label}
        <InfoTooltip description={description} />
      </span>
      <Switch checked={checked} disabled={disabled} onCheckedChange={(on) => onChange(on)} />
    </Label>
  );
}
