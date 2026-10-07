import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipPopup, TooltipTrigger } from '@/components/ui/tooltip';
import { InfoIcon } from 'lucide-react';

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
    <Label className="justify-between gap-3">
      <span className="flex items-center gap-2">
        {title}
        <Tooltip>
          <TooltipTrigger
            aria-label={description}
            // A span, not a button: a button inside the label would take its
            // association from the switch. Clicks must not toggle the switch.
            onClick={(e) => e.preventDefault()}
            render={<span tabIndex={0} />}
          >
            <InfoIcon className="size-4 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipPopup>{description}</TooltipPopup>
        </Tooltip>
      </span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </Label>
  );
}
