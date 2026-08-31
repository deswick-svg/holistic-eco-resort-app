const OFFICIAL_SITE_ORIGIN = "https://www.holisticecoresort.com";
const SIMPLOTEL_ASSET_HOST = "assets.simplotel.com";
const RESORT_ASSET_SEGMENTS = [
  "/holistic-eco-resort-kannur/",
  "/holistic-stay-eco-resort-kannur/",
  "/holistic-stay-eco-resort/",
] as const;
const ROOM_PAGE_REVALIDATE_SECONDS = 6 * 60 * 60;
const ROOM_PAGE_TIMEOUT_MS = 15_000;
const MAX_ROOM_PAGE_BYTES = 1_000_000;

export type RoomPageDefinition = {
  roomTypeId: string;
  roomName: string;
  pageUrl: string;
};

export type RoomMedia = {
  roomTypeId: string;
  roomName: string;
  sourcePage: string;
  primaryImage: string;
  gallery: string[];
};

export type RoomMediaResult =
  | { ok: true; media: RoomMedia }
  | { ok: false; room: RoomPageDefinition; error: string };

export const ROOM_PAGES: readonly RoomPageDefinition[] = [
  {
    roomTypeId: "103941",
    roomName: "Forest View Room",
    pageUrl: `${OFFICIAL_SITE_ORIGIN}/rooms/forest-view-room-at-holistic-eco-resort-and-ayurvedic-retreat.html`,
  },
  {
    roomTypeId: "103939",
    roomName: "Tree House",
    pageUrl: `${OFFICIAL_SITE_ORIGIN}/rooms/tree-house-at-holistic-eco-resort-and-ayurvedic-retreat.html`,
  },
  {
    roomTypeId: "104610",
    roomName: "Kerala Traditional Villa with Private Balcony",
    pageUrl: `${OFFICIAL_SITE_ORIGIN}/rooms/kerala-traditional-villa-with-private-balcony.html`,
  },
  {
    roomTypeId: "103942",
    roomName: "Caravan Stay",
    pageUrl: `${OFFICIAL_SITE_ORIGIN}/rooms/caravan-stay-at-holistic-eco-resort-and-ayurvedic-retreat.html`,
  },
  {
    roomTypeId: "103943",
    roomName: "Tower Suite with Private Balcony",
    pageUrl: `${OFFICIAL_SITE_ORIGIN}/rooms/tower-suite-with-private-balcony.html`,
  },
  {
    roomTypeId: "103944",
    roomName: "Family Suite with Private Balcony",
    pageUrl: `${OFFICIAL_SITE_ORIGIN}/rooms/family-suite-with-private-balcony.html`,
  },
  {
    roomTypeId: "119794",
    roomName: "Glass Dome",
    pageUrl: `${OFFICIAL_SITE_ORIGIN}/rooms/glass-dome.html`,
  },
] as const;

const EXCLUDED_ASSET_NAMES =
  /(?:^|[_-])(logo|favicon|icon|loader|loading|placeholder|spinner|sprite|badge)(?:[_-]|$)/i;

function decodeHtmlAttribute(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function getGalleryMarkup(html: string) {
  const slidesAttribute = 'data-u="slides"';
  const attributeIndex = html.indexOf(slidesAttribute);

  if (attributeIndex === -1) {
    throw new Error("Official room gallery was not found in the page markup.");
  }

  const galleryStart = html.lastIndexOf("<div", attributeIndex);
  const galleryEnd = html.indexOf('<div class="jssora', attributeIndex);

  if (galleryStart === -1 || galleryEnd === -1 || galleryEnd <= galleryStart) {
    throw new Error("Official room gallery markup is incomplete.");
  }

  return html.slice(galleryStart, galleryEnd);
}

function canonicalAssetId(url: URL) {
  const resortAssetSegment = RESORT_ASSET_SEGMENTS.find((segment) =>
    url.pathname.includes(segment)
  );
  if (!resortAssetSegment) return null;

  const encodedAssetName = url.pathname.slice(
    url.pathname.indexOf(resortAssetSegment) + resortAssetSegment.length
  );
  const assetName = decodeURIComponent(encodedAssetName)
    .replace(/\.(?:avif|jpe?g|png|webp)$/i, "")
    .toLowerCase();

  if (!assetName || assetName.includes("/") || EXCLUDED_ASSET_NAMES.test(assetName)) {
    return null;
  }

  return assetName;
}

function normalizeOfficialImage(candidate: string) {
  try {
    const url = new URL(decodeHtmlAttribute(candidate));

    if (
      url.protocol !== "https:" ||
      url.hostname !== SIMPLOTEL_ASSET_HOST ||
      !url.pathname.startsWith("/simplotel/image/upload/") ||
      canonicalAssetId(url) === null
    ) {
      return null;
    }

    url.hash = "";
    url.search = "";
    return url;
  } catch {
    return null;
  }
}

export function extractOfficialRoomImages(html: string) {
  const galleryMarkup = getGalleryMarkup(html);
  const imageTags = galleryMarkup.match(/<img\b[^>]*\bdata-u=["']image["'][^>]*>/gi) ?? [];
  const images: string[] = [];
  const seenAssets = new Set<string>();

  for (const imageTag of imageTags) {
    const sourceMatch = imageTag.match(
      /\b(?:data-src2|data-src|src)=["']([^"']+)["']/i
    );
    if (!sourceMatch) continue;

    const imageUrl = normalizeOfficialImage(sourceMatch[1]);
    if (!imageUrl) continue;

    const assetId = canonicalAssetId(imageUrl);
    if (!assetId || seenAssets.has(assetId)) continue;

    seenAssets.add(assetId);
    images.push(imageUrl.toString());
  }

  return images;
}

async function fetchRoomPage(room: RoomPageDefinition) {
  const pageUrl = new URL(room.pageUrl);
  if (pageUrl.origin !== OFFICIAL_SITE_ORIGIN || !pageUrl.pathname.startsWith("/rooms/")) {
    throw new Error("Room page is outside the official-site allowlist.");
  }

  const response = await fetch(room.pageUrl, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "HolisticEcoResortRoomMedia/1.0",
    },
    next: {
      revalidate: ROOM_PAGE_REVALIDATE_SECONDS,
      tags: [`room-media-${room.roomTypeId}`],
    },
    signal: AbortSignal.timeout(ROOM_PAGE_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Official room page returned HTTP ${response.status}.`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("text/html")) {
    throw new Error("Official room page did not return HTML.");
  }

  const contentLength = Number(response.headers.get("content-length") ?? 0);
  if (contentLength > MAX_ROOM_PAGE_BYTES) {
    throw new Error("Official room page exceeded the size limit.");
  }

  const html = await response.text();
  if (html.length > MAX_ROOM_PAGE_BYTES) {
    throw new Error("Official room page exceeded the size limit.");
  }

  return html;
}

export async function retrieveRoomMedia(
  room: RoomPageDefinition
): Promise<RoomMediaResult> {
  try {
    const html = await fetchRoomPage(room);
    const gallery = extractOfficialRoomImages(html);

    if (gallery.length === 0) {
      throw new Error("No official room photographs passed validation.");
    }

    return {
      ok: true,
      media: {
        roomTypeId: room.roomTypeId,
        roomName: room.roomName,
        sourcePage: room.pageUrl,
        primaryImage: gallery[0],
        gallery,
      },
    };
  } catch (error) {
    return {
      ok: false,
      room,
      error: error instanceof Error ? error.message : "Unknown room-media error.",
    };
  }
}

export async function retrieveAllRoomMedia() {
  return Promise.all(ROOM_PAGES.map(retrieveRoomMedia));
}
