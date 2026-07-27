export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Appends a short random suffix to avoid collisions without an extra DB round-trip. */
export function uniqueSlug(input: string): string {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${slugify(input)}-${suffix}`;
}
