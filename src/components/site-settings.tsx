import { CircleOffIcon, Undo2Icon } from 'lucide-react';
import { AccordionItem, AccordionPanel, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Frame, FrameHeader, FramePanel } from '@/components/ui/frame';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { isCustomised, pruneUserSettings, type UserSettings } from '@/features/settings';
import { siteHosts, type Site } from '@/sites';
import { i18n } from '@/utils/i18n';
import { FeatureList, type OnLayerChange } from './feature-list';

export type SiteSettingsProps = {
  site: Site;
  global: UserSettings;
  /** This site's override layer. */
  override: UserSettings;
  disabled: boolean;
  /** `persist: false` updates the UI only (e.g. while dragging a slider). */
  onChange: OnLayerChange;
  onDisabledChange: (disabled: boolean) => void;
};

/** Whether the site's override changes anything over the global layer. */
export function isSiteCustomised({ site, override, global }: SiteSettingsProps): boolean {
  return isCustomised(pruneUserSettings(site.features, override, global));
}

/** The popup's card for the site in the current tab. */
export function CurrentSiteSettings(props: SiteSettingsProps) {
  const { site, disabled, onDisabledChange } = props;
  return (
    <Frame>
      <FrameHeader className="flex-row items-center gap-3 px-4 py-3">
        <SiteHeading site={site} />
        <Switch
          aria-label={i18n.t('siteSettings.enabled')}
          checked={!disabled}
          onCheckedChange={(enabled) => onDisabledChange(!enabled)}
          title={i18n.t('siteSettings.enabled')}
        />
      </FrameHeader>
      <FramePanel className="p-4">
        <SiteBody {...props} />
      </FramePanel>
    </Frame>
  );
}

/** One site in the options page's list, collapsed until opened. */
export function SiteSettingsItem(props: SiteSettingsProps) {
  const { site, disabled, onDisabledChange } = props;
  return (
    <AccordionItem value={site.name}>
      <AccordionTrigger className="items-center px-4 py-3 hover:bg-accent/50">
        <SiteHeading customised={isSiteCustomised(props)} disabled={disabled} site={site} />
      </AccordionTrigger>
      <AccordionPanel className="flex flex-col gap-4 px-4 pt-1 text-foreground">
        <Label className="justify-between gap-3 rounded-lg bg-muted/64 px-3 py-2">
          {i18n.t('siteSettings.enabled')}
          <Switch checked={!disabled} onCheckedChange={(enabled) => onDisabledChange(!enabled)} />
        </Label>
        <SiteBody {...props} />
      </AccordionPanel>
    </AccordionItem>
  );
}

function SiteHeading({
  site,
  customised,
  disabled,
}: {
  site: Site;
  customised?: boolean;
  disabled?: boolean;
}) {
  return (
    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span className="flex items-center gap-1.5 text-sm font-semibold">
        {site.label}
        {disabled && (
          <Badge size="sm" variant="warning">
            {i18n.t('siteSettings.disabled')}
          </Badge>
        )}
        {customised && (
          <Badge size="sm" variant="secondary">
            {i18n.t('siteSettings.customised')}
          </Badge>
        )}
      </span>
      <span className="truncate text-xs font-normal text-muted-foreground">
        {siteHosts(site).join(i18n.t('siteSettings.hostSeparator'))}
      </span>
    </span>
  );
}

/** The site's feature controls over the global layer, or a note when disabled. */
function SiteBody(props: SiteSettingsProps) {
  const { site, global, override, disabled, onChange } = props;
  if (disabled) {
    return (
      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <CircleOffIcon className="mt-px size-3.5 shrink-0" />
        {i18n.t('siteSettings.disabledHint')}
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <FeatureList
        beneath={[global]}
        layer={override}
        onChange={onChange}
        siteFeatures={site.features}
      />
      {isSiteCustomised(props) && (
        <div className="flex items-center justify-between gap-2 border-t pt-3">
          <span className="text-xs text-muted-foreground">
            {i18n.t('siteSettings.customisedHint')}
          </span>
          <Button onClick={() => onChange({}, true)} size="xs" variant="ghost">
            <Undo2Icon />
            {i18n.t('siteSettings.followGlobal')}
          </Button>
        </div>
      )}
    </div>
  );
}
