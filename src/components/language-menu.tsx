import { LanguagesIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Menu,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuTrigger,
} from '@/components/ui/menu';
import { useLocalePreference } from '@/hooks/use-locale';
import { i18n, setLocalePreference } from '@/utils/i18n';
import { LOCALE_NAMES, LOCALES, parseLocalePreference } from '@/utils/messages';

/** Icon button that picks the UI language (or follows the browser's). */
export function LanguageMenu() {
  const preference = useLocalePreference();
  const label = i18n.t('language.label');

  return (
    <Menu>
      <MenuTrigger
        render={<Button aria-label={label} size="icon-sm" title={label} variant="ghost" />}
      >
        <LanguagesIcon />
      </MenuTrigger>
      <MenuPopup align="end">
        <MenuRadioGroup
          onValueChange={(value) => void setLocalePreference(parseLocalePreference(value))}
          value={preference}
        >
          <MenuRadioItem value="auto">{i18n.t('language.auto')}</MenuRadioItem>
          <MenuSeparator />
          {LOCALES.map((locale) => (
            <MenuRadioItem key={locale} lang={LOCALE_NAMES[locale].lang} value={locale}>
              {LOCALE_NAMES[locale].name}
            </MenuRadioItem>
          ))}
        </MenuRadioGroup>
      </MenuPopup>
    </Menu>
  );
}
