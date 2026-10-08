import { describe, expect, test } from 'bun:test';
import type { SectionFeatures } from '@/features/settings';
import { sectionFeatures, settingsFeatures } from './layers';
import type { Site } from './types';

const testSite = (...matches: string[]): Site => ({ name: 't', label: 'T', matches });

const rewriteLink = () => null;

describe('sections', () => {
  const hide = ['.ad'];
  const site: Site = {
    ...testSite('*://a.test/*', '*://reader.a.test/*'),
    features: { blockAds: { hide }, pageDistance: { container: '#c' } },
    sections: {
      main: { features: { autoContinue: { selector: '.go' } } },
      reader: {
        matches: ['*://reader.a.test/*', '*://a.test/read/*'],
        features: {
          blockAds: { remove: ['#x'] },
          skipRedirects: { rewriteLink },
          pageDistance: false,
        },
      },
    },
  };

  describe('sectionFeatures', () => {
    test("merges the section's configs over the site's, feature by feature", () => {
      expect(sectionFeatures(site, 'reader')).toEqual({
        blockAds: { hide, remove: ['#x'] },
        skipRedirects: { rewriteLink },
        pageDistance: false,
      });
      expect(sectionFeatures(site, 'main')).toEqual({
        blockAds: { hide },
        pageDistance: { container: '#c' },
        autoContinue: { selector: '.go' },
      });
    });

    test("a section's lists add to the site's; other fields replace them", () => {
      const s: Site = {
        ...site,
        features: { autoContinue: { selector: '.a' }, blockAds: { hide } },
        sections: {
          main: {
            features: { autoContinue: { selector: '.b' }, blockAds: { hide: ['.more'] } },
          },
        },
      };
      expect(sectionFeatures(s, 'main')).toMatchObject({
        autoContinue: { selector: '.b' },
        blockAds: { hide: ['.ad', '.more'] },
      });
      expect(sectionFeatures(s, 'reader').blockAds).toEqual({ hide });
    });

    test('a section can configure a feature the site turned off', () => {
      const s: Site = {
        ...site,
        features: { blockAds: false },
        sections: { main: { features: { blockAds: { hide } } } },
      };
      expect(sectionFeatures(s, 'main').blockAds).toEqual({ hide });
    });

    test('undefined section values keep the site config', () => {
      const s: Site = { ...site, sections: { main: { features: { blockAds: undefined } } } };
      expect(sectionFeatures(s, 'main').blockAds).toEqual({ hide });
    });

    test('without sections, it is the site layer', () => {
      expect(sectionFeatures(testSite(), 'reader')).toEqual({});
    });

    test('sections set adapters, not user option defaults', () => {
      // @ts-expect-error `ratio` is a user option: its default is per site.
      const features: SectionFeatures = { pageDistance: { ratio: 0.5 } };
      expect(features).toBeDefined();
    });
  });

  describe('settingsFeatures', () => {
    test('lists a feature any section configures', () => {
      const layer = settingsFeatures(site);
      expect(layer.autoContinue).toEqual({ selector: '.go' });
      expect(layer.skipRedirects).toEqual({ rewriteLink });
      // On in the main site, off in the reader: still listed.
      expect(layer.pageDistance).toEqual({ container: '#c' });
    });

    test('is false only where every section turns it off', () => {
      const s: Site = {
        ...site,
        features: { smoothScroll: false },
        sections: { reader: { matches: ['*://a.test/r/*'], features: { pageDistance: false } } },
      };
      expect(settingsFeatures(s).smoothScroll).toBe(false);
      expect(settingsFeatures(s).pageDistance).toBeUndefined();
    });

    test('without sections, it is the site layer', () => {
      const features = { blockAds: { hide } };
      expect(settingsFeatures({ ...testSite(), features })).toBe(features);
    });
  });
});
