import { describe, expect, it } from 'vitest';

describe('sanity checks', () => {
  it('adds numbers', () => {
    expect(1 + 1).toBe(2);
  });

  it('provides a DOM', () => {
    const div = document.createElement('div');
    div.id = 'root';
    expect(div.id).toBe('root');
  });
});
