import type { ChapterImages } from '@/utils/chapter-images';
import { defineSite } from './types';

/** The chapter's page images (desktop), not lazy-loaded. */
const images: ChapterImages = { selector: '.comic_wraCon .scrollbar-demo-item img', src: 'src' };

/**
 * 再漫畫: Nuxt desktop front ends on `www.` (and the apex, the same site) and
 * `manhua.`; a uni-app front end on `m.`. `www.` sends mobile browsers to
 * `m.`, `m.` sends desktop ones to `manhua.`.
 *
 * - Routes: works `www.`: `/info/<slug>.html`, `manhua.`: `/details/<id>`;
 *   chapter on both `/view/<slug>/<id>/<chapter>`; `m.`: chapter
 *   `/pages/comic/page?comic_id=…&chapter_id=…`.
 * - Desktop reader: paged by default, one image at a time; 「切換到上下滾動閱讀」
 *   (cookie `fanyemodeval=2`) shows every page in a strip. Both modes keep
 *   the images in `.scrollbar-demo-item`, with a plain `src` (paged: only
 *   the page shown, so the reading position only means something in the
 *   strip). The work link and the chapter title are in `.display_middle`;
 *   the link differs per host (`/info/…` vs `/details/…`), so the hosts
 *   keep separate history.
 *   Prev / next chapter are JS (`#next_chapter` has no `href`).
 * - Mobile reader: a strip in a uni-app scroll view (not the page); images
 *   are drawn as backgrounds, the `img` inside is hidden, and the page names
 *   neither the work nor the chapter outside its menu, so only the scroll
 *   view (Page Up/Down) and the image host are configured there.
 * - Images on `images.zaimanhua.com` (signed URLs). No ads seen.
 * - Domains: other subdomains are separate services (`i.`, `news.`,
 *   `nbbs.`, `static.`). Full list: docs/manga-sites.md.
 */
export const site = defineSite({
  name: 'zaimanhua',
  label: '再漫畫',
  matches: [
    '*://www.zaimanhua.com/*',
    '*://zaimanhua.com/*',
    '*://manhua.zaimanhua.com/*',
    '*://m.zaimanhua.com/*',
  ],
  sections: {
    reader: {
      matches: [
        '*://www.zaimanhua.com/view/*',
        '*://zaimanhua.com/view/*',
        '*://manhua.zaimanhua.com/view/*',
        '*://m.zaimanhua.com/pages/comic/page*',
      ],
      features: {
        fastLoad: { origins: ['https://images.zaimanhua.com'] },
        reloadBrokenImages: { images },
        readingHistory: {
          work: '.display_middle h1 > a',
          chapter: '.display_middle > span',
          images,
        },
        pageKeys: { container: '.strip-reader > .uni-scroll-view > .uni-scroll-view' },
      },
    },
  },
});
