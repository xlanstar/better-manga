import React, { type ComponentType } from 'react';
import ReactDOM from 'react-dom/client';
import { initLocale } from '@/utils/i18n';
import '@/assets/style.css';

/** Render an extension page's root component (popup, options). */
export function mountApp(App: ComponentType) {
  // coss ui uses a `.dark` class; follow the system color scheme.
  const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const applyTheme = () => document.documentElement.classList.toggle('dark', darkQuery.matches);
  applyTheme();
  darkQuery.addEventListener('change', applyTheme);

  // The chosen language (and `<html lang>`) is set before the first render.
  void initLocale().finally(() =>
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    ),
  );
}
