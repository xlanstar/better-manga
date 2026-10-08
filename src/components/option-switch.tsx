import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

/** A feature option as a switch, with its label and a line on what it does. */
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
      <span className="flex flex-col">
        <span>{label}</span>
        <span className="text-muted-foreground">{description}</span>
      </span>
      <Switch checked={checked} disabled={disabled} onCheckedChange={(on) => onChange(on)} />
    </Label>
  );
}
