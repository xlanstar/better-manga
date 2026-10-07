import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

/** A feature's title and description with its on/off switch. */
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
    <Label className="items-start justify-between gap-3">
      <span className="flex flex-col gap-1">
        {title}
        <span className="text-xs font-normal text-muted-foreground">{description}</span>
      </span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </Label>
  );
}
