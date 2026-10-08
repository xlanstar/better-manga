import type { ChapterImages } from '@/utils/chapter-images';
import { defineSite } from './types';

/**
 * The chapter's page images, in the strip readers: desktop's vertical mode
 * (`#comicContain`), mobile (`#cp_img`).
 */
const images: ChapterImages = {
  selector: '#comicContain img[data-src], #cp_img > img.lazy',
  src: 'data-src',
};

/**
 * 漫本: DM5 network (`dm5`'s backend and image hosts), its own templates.
 *
 * - Front end: server-rendered (jQuery), one host; phones get a mobile
 *   layout.
 * - Routes: works `/mh-<slug>/`, chapter `/m<cid>/`.
 * - Reader, desktop: a two-page spread by default (`#mangaImg_<n>`, paged
 *   by `#page_<n>` hash, no image config). 切换至垂直阅读 (cookie
 *   `showtype`) turns it into a strip of `img[data-src]` appended to
 *   `#comicContain` as you scroll, inside the `#mainView` scroller (where
 *   the reading position is recorded but not restored), with a next-chapter
 *   link (`#mainControlNext`). The header names the work (link
 *   `/mh-<slug>/`) and the chapter.
 * - Reader, mobile: a strip of `#cp_img > img.lazy[data-src]`; the title bar
 *   names the work only as text, so no reading history there.
 * - Images: `manhua10<nn>zjcdn<63|79>.cdndm5.com`, many hosts, so no
 *   `origins`.
 * - Every chapter page records itself in the `recordChapterId` cookie,
 *   which `keepStorage` can't undo, so no `nextChapter`.
 * - Ads: none seen. Not handled: the mobile app-download bar.
 * - Domains: the bare host redirects to `www.`. Full list:
 *   docs/manga-sites.md.
 */
export const site = defineSite({
  name: 'manben',
  label: '漫本',
  matches: ['*://www.manben.com/*'],
  features: {
    fastLoad: { images },
    reloadBrokenImages: { images },
    readingHistory: {
      work: '#comicTitle > #chapter',
      chapter: '#comicTitle > .title-comicHeading',
      images,
    },
    pageKeys: { container: '#mainView' },
  },
});
