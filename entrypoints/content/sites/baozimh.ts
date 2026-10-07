import { clickOnAppear, keepHidden } from '@/utils/dom';
import type { Site } from './types';

export default {
  name: 'baozimh',
  label: '包子漫畫',
  matches: ['*://*.baozimh.org/*', '*://*.bzmh.org/*'],
  run() {
    // Class only, no tag — the ad containers are injected by the
    // page's own scripts and are not always <div>.
    keepHidden('.baozi-ad', '.mobadsq');
    // 「點擊繼續閱讀」之類的按鈕，出現就按一次。
    clickOnAppear('.pure-button', 500);
  },
} satisfies Site;
