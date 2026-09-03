import assert from 'node:assert/strict';
import test from 'node:test';
import { createGuestHistoryWriteRepository } from './writeRepository.ts';

globalThis.fetch = async () => { throw new Error('Live network forbidden'); };
test('write facade is lazy, exposes only lifecycle methods and pins the approved development target', async () => {
  let creates = 0;
  const backing = {
    begin: async (...args: unknown[]) => args,
    advance: async (...args: unknown[]) => args,
    getOwned: async (...args: unknown[]) => args,
  };
  const repository = createGuestHistoryWriteRepository(config => {
    creates++; assert.deepEqual(config, { region: 'eu-north-1', table: 'holistic-eco-resort-guest-bookings-dev' });
    return { repository: backing as never, client: {} as never, destroy() {} };
  }, () => ({ region: 'eu-north-1', table: 'holistic-eco-resort-guest-bookings-dev' }));
  assert.deepEqual(Object.keys(repository).sort(), ['advance', 'begin', 'getOwned']); assert.equal(creates, 0);
  await repository.getOwned({ issuer: 'TEST', sub: 'TEST' }, 7849, 'test-submission-0001'); assert.equal(creates, 1);
});

test('write facade rejects every other region or table before constructing transport', async () => {
  for (const config of [{ region: 'eu-west-1', table: 'holistic-eco-resort-guest-bookings-dev' },
    { region: 'eu-north-1', table: 'other-table' }]) {
    let creates = 0;
    const repository = createGuestHistoryWriteRepository(() => { creates++; throw new Error('must not construct'); }, () => config);
    assert.throws(() => repository.getOwned({ issuer: 'TEST', sub: 'TEST' }, 7849, 'test-submission-0001'), /configuration/);
    assert.equal(creates, 0);
  }
});
