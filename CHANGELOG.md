# Changelog

User-visible changes, newest first: new or changed sites and features, fixes.
List each change under `## Unreleased` as it lands; `bun run release` moves
them under the new version, and the GitHub release shows that section.

## Unreleased

- 36 new sites: 包子漫畫 (baozimh.com and its mirrors), 拷貝漫畫, 熱辣漫畫,
  漫畫櫃, 再漫畫, 動漫屋, 極速漫畫, 漫畫人, 漫本, Mangabz, XManhua, YYManhua,
  Komiic, 無限動漫, COLAMANGA, 漫蛙, 喜漫漫畫, 漫畫狗, 瓜子漫畫, 六漫畫,
  MYCOMIC, vomic漫, 優酷漫畫, 漫畫屋, 妙趣漫畫, 漫畫1234, 漫畫160, 92漫畫,
  CManhua, 嗶哩漫畫, 古風漫畫, 禁漫天堂, 紳士漫畫, NoyAcg, hanime1 and 肉漫屋.
  Page Up / Down works on all of them; ad blocking, faster loading, broken
  image retries and reading history where the site allows.
- The two sites called 包子漫畫 are now told apart by their domain:
  「包子漫畫（baozimh.org）」 and 「包子漫畫（baozimh.com）」.
- Page Up / Down distance and smooth scrolling are now one setting, "Page
  Up / Down", with smooth scrolling as an option in it.
- Settings are grouped into Ads & distractions, Loading and Reading, and
  every feature has a simpler name and description.
- Clearer settings layout: groups are separated by dividers, and a
  feature's options sit in a panel under its switch.
- New feature: reading history. Remembers the chapter you last read of each
  work and where you were in it; reopening the chapter takes you back there,
  and the popup lists your latest works to continue reading. The settings
  page shows the full history, where you can remove works or clear it. Kept
  only in your browser (包子漫畫, G站漫畫, 18漫畫, 嬉皮漫畫).
- New feature: retry broken images. Chapter images that fail to load are
  retried a few times, and again once you're back online (包子漫畫, G站漫畫,
  18漫畫, 嬉皮漫畫).
