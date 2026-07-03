/** Первая буква с заглавной — единообразно на API и вебе. */
export function sentenceCase(text: string | null | undefined): string {
  if (text == null) return "";
  const t = text.trim();
  if (!t) return "";
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function sentenceCaseLines(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map(sentenceCase);
}
