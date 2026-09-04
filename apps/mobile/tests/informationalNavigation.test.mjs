import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const app = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
const home = readFileSync(new URL('../src/screens/HomeScreen.tsx', import.meta.url), 'utf8');
const menu = readFileSync(new URL('../src/data/menu.ts', import.meta.url), 'utf8');

const screenRoutes = [
  ['dining', 'DiningScreen'],
  ['activities', 'ActivitiesScreen'],
  ['spa', 'SpaScreen'],
  ['map', 'PropertyMapScreen'],
  ['attractions', 'LocalAttractionsScreen'],
  ['gallery', 'GalleryScreen'],
  ['contact', 'ContactScreen'],
  ['reviews', 'ReviewScreen'],
  ['coupon', 'CouponScreen'],
];

test('every completed informational menu destination has an explicit screen route', () => {
  for (const [route, screen] of screenRoutes) {
    assert.match(menu, new RegExp(`key: '${route}'`));
    assert.match(app, new RegExp(`screen === '${route}'[\\s\\S]{0,180}<${screen}`));
  }
  assert.match(app, /screen === 'reviews' \|\| screen === 'tripadvisor' \|\| screen === 'google-review'/);
});

test('Home WhatsApp uses only the published resort number and has safe fallbacks', () => {
  assert.match(home, /officialWhatsAppNumber = '919495850389'/);
  assert.match(home, /whatsapp:\/\/send\?phone=\$\{officialWhatsAppNumber\}/);
  assert.match(home, /https:\/\/wa\.me\/\$\{officialWhatsAppNumber\}/);
  assert.match(home, /onSelect\('contact'\)/);
  assert.doesNotMatch(home, /text=|prefill|message=/i);
});
