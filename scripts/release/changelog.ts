/**
 * Moves CHANGELOG.md's `## Unreleased` entries under `## <version> - <date>`,
 * leaving `## Unreleased` empty. Returns the new text and the moved entries
 * (`notes`); throws if there is nothing to release.
 */
export function releaseChangelog(
  text: string,
  version: string,
  date: string,
): { changelog: string; notes: string } {
  const heading = /^## Unreleased\n/m.exec(text);
  if (!heading) throw new Error('CHANGELOG.md has no "## Unreleased" heading');

  const bodyStart = heading.index + heading[0].length;
  const rest = text.slice(bodyStart);
  const next = rest.search(/^## /m);
  const notes = (next === -1 ? rest : rest.slice(0, next)).trim();
  if (!notes) throw new Error('CHANGELOG.md: "## Unreleased" is empty; list the changes first');

  const older = next === -1 ? '' : `\n${rest.slice(next)}`;
  const changelog = `${text.slice(0, bodyStart)}\n## ${version} - ${date}\n\n${notes}\n${older}`;
  return { changelog, notes };
}
