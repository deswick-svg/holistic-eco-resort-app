import assert from "node:assert/strict";
import test from "node:test";
import { extractOfficialRoomImages } from "./roomMedia.ts";

const officialImage =
  "https://assets.simplotel.com/simplotel/image/upload/x_0,y_10,w_1200,h_700,c_crop/w_900,f_auto,c_fit/holistic-eco-resort-kannur/forest-room-1_abcd1234";

test("extracts only official room-carousel images", () => {
  const html = `
    <img src="https://assets.simplotel.com/simplotel/image/upload/holistic-eco-resort-kannur/site-logo_1234.png">
    <div class="sliders-jssor slider" data-u="slides">
      <div class="item"><img data-src2="${officialImage}" data-u="image"></div>
      <div class="item"><img data-src2="https://example.com/not-official.jpg" data-u="image"></div>
      <div class="item"><img data-src2="https://assets.simplotel.com/simplotel/image/upload/w_900/another-property/foreign-room" data-u="image"></div>
      <div class="item"><img data-src2="https://assets.simplotel.com/simplotel/image/upload/w_900/holistic-eco-resort-kannur/gallery-placeholder_1234" data-u="image"></div>
      <div class="loading"><img src="./tail-spin.svg" data-u="loading"></div>
    </div>
    <div class="jssora051 arrowleft-jssor"></div>
  `;

  assert.deepEqual(extractOfficialRoomImages(html), [officialImage]);
});

test("deduplicates transformed URLs for the same underlying asset", () => {
  const duplicateTransform =
    "https://assets.simplotel.com/simplotel/image/upload/w_400,c_fit/holistic-eco-resort-kannur/forest-room-1_abcd1234";
  const secondImage =
    "https://assets.simplotel.com/simplotel/image/upload/w_900,c_fit/holistic-eco-resort-kannur/forest-room-2_efgh5678";
  const html = `
    <div class="sliders-jssor slider" data-u="slides">
      <img data-src2="${officialImage}" data-u="image">
      <img data-src2="${duplicateTransform}" data-u="image">
      <img data-src2="${secondImage}" data-u="image">
    </div>
    <div class="jssora051 arrowleft-jssor"></div>
  `;

  assert.deepEqual(extractOfficialRoomImages(html), [officialImage, secondImage]);
});

test("accepts the resort's explicitly allowlisted historical CDN namespaces", () => {
  const historicalImage =
    "https://assets.simplotel.com/simplotel/image/upload/w_900,c_fit/holistic-stay-eco-resort-kannur/tower-room_1234";
  const olderHistoricalImage =
    "https://assets.simplotel.com/simplotel/image/upload/w_900,c_fit/holistic-stay-eco-resort/family-room_5678";
  const html = `
    <div class="sliders-jssor slider" data-u="slides">
      <img data-src2="${historicalImage}" data-u="image">
      <img data-src2="${olderHistoricalImage}" data-u="image">
    </div>
    <div class="jssora051 arrowleft-jssor"></div>
  `;

  assert.deepEqual(extractOfficialRoomImages(html), [
    historicalImage,
    olderHistoricalImage,
  ]);
});

test("fails closed when the official gallery container is absent", () => {
  assert.throws(
    () => extractOfficialRoomImages(`<img src="${officialImage}">`),
    /gallery was not found/i
  );
});
