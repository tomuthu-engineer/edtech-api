import { slugify, uniqueSlug } from '@utils/slugify';

describe('slugify utils', () => {
  it('lowercases and hyphenates a title', () => {
    expect(slugify('Introduction to Web Development!')).toBe('introduction-to-web-development');
  });

  it('collapses repeated non-alphanumeric characters', () => {
    expect(slugify('React  &  Redux -- Deep Dive')).toBe('react-redux-deep-dive');
  });

  it('trims leading and trailing hyphens', () => {
    expect(slugify('  --Edge Case--  ')).toBe('edge-case');
  });

  it('uniqueSlug appends a random suffix to the base slug', () => {
    const slug = uniqueSlug('My Course Title');
    expect(slug.startsWith('my-course-title-')).toBe(true);
    expect(slug.length).toBeGreaterThan('my-course-title-'.length);
  });

  it('uniqueSlug produces different suffixes across calls', () => {
    const a = uniqueSlug('Same Title');
    const b = uniqueSlug('Same Title');
    expect(a).not.toBe(b);
  });
});
