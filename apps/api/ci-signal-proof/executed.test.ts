import { expect, it } from 'vitest';
it('one executed case is real signal', () => { expect(2 + 2).toBe(4); });
it.skip('skipped case does not add executed signal', () => {});
