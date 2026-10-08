# Changelog

User-visible changes, newest first: new or changed sites and features, fixes.
List each change under `## Unreleased` as it lands; `bun run release` moves
them under the new version, and the GitHub release shows that section.

## Unreleased

- Page Up / Down distance and smooth scrolling are now one setting, "Page
  Up / Down", with smooth scrolling as an option in it.
- Settings are grouped into Ads & distractions, Loading and Reading, and
  every feature has a simpler name and description.
- New feature: reading history. Remembers the chapter you last read of each
  work and where you were in it; reopening the chapter takes you back there,
  and the popup lists your latest works to continue reading. The settings
  page shows the full history, where you can remove works or clear it. Kept
  only in your browser (包子漫畫, G站漫畫, 18漫畫, 嬉皮漫畫).
- New feature: retry broken images. Chapter images that fail to load are
  retried a few times, and again once you're back online (包子漫畫, G站漫畫,
  18漫畫, 嬉皮漫畫).
