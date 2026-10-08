import { Tooltip, TooltipPopup, TooltipTrigger } from '@/components/ui/tooltip';
import { InfoIcon } from 'lucide-react';

/** An info icon showing `description` in a tooltip; safe inside a switch's label. */
export function InfoTooltip({ description }: { description: string }) {
  return (
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
  );
}
