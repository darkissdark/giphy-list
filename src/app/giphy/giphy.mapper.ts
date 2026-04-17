import type { GiphyGif } from './giphy-api.types';
import type { GifDetails, GifItem } from './giphy.types';

type ImageVariant = { url?: string; webp?: string; width?: string; height?: string };

function variantDims(v: ImageVariant | undefined): { w: number; h: number } {
  const w = Number(v?.width) || 0;
  const h = Number(v?.height) || 0;
  return { w, h };
}

function handleRasterFallbacks(images: GiphyGif['images']): {
  previewUrl: string;
  webpUrl: string;
  width: number;
  height: number;
} {
  const fallbacks = [
    images?.fixed_width_small,
    images?.fixed_width,
    images?.downsized,
    images?.original,
  ];

  for (const raster of fallbacks) {
    const rasterUrl = raster?.url?.trim() ?? '';
    const layerWebp = raster?.webp?.trim() ?? '';
    if (!rasterUrl && !layerWebp) continue;
    const { w, h } = variantDims(raster);
    return {
      previewUrl: rasterUrl || layerWebp,
      webpUrl: layerWebp,
      width: w,
      height: h,
    };
  }

  return { previewUrl: '', webpUrl: '', width: 0, height: 0 };
}

function pickPreviewBundle(images: GiphyGif['images']): {
  previewUrl: string;
  webpUrl: string;
  width: number;
  height: number;
} {
  const fH = images?.fixed_height;
  const fHw = images?.fixed_height_webp;

  const webpUrl = fHw?.url?.trim() || fH?.webp?.trim() || '';
  const gifUrl = fH?.url?.trim() || '';

  const width = Number(fH?.width || fHw?.width || 0) || 0;
  const height = Number(fH?.height || fHw?.height || 200) || 200;

  if (gifUrl || webpUrl) {
    return {
      previewUrl: gifUrl || webpUrl,
      webpUrl,
      width,
      height,
    };
  }

  return handleRasterFallbacks(images);
}

function pickOriginalUrl(images: GiphyGif['images']): string {
  return (
    images?.original?.url ??
    images?.downsized?.url ??
    pickPreviewBundle(images).previewUrl
  );
}

function pickShareUrl(gif: GiphyGif): string {
  return gif.bitly_gif_url ?? gif.url ?? pickOriginalUrl(gif.images);
}

function pickTitle(gif: GiphyGif): string {
  const t = gif.title?.trim();
  return t && t.length > 0 ? t : 'Untitled GIF';
}

function pickAlt(gif: GiphyGif): string {
  const a = gif.alt_text?.trim();
  if (a && a.length > 0) return a;
  return pickTitle(gif);
}

function pickUsername(gif: GiphyGif): string {
  const u = gif.user?.username?.trim();
  if (u && u.length > 0) return u;
  const legacy = gif.username?.trim();
  if (legacy && legacy.length > 0) return legacy;
  return 'Unknown';
}

export function mapGiphyGifToItem(gif: GiphyGif): GifItem {
  const preview = pickPreviewBundle(gif.images);
  return {
    id: gif.id,
    title: pickTitle(gif),
    alt: pickAlt(gif),
    previewUrl: preview.previewUrl,
    webpUrl: preview.webpUrl,
    shareUrl: pickShareUrl(gif),
    username: pickUsername(gif),
    width: preview.width,
    height: preview.height,
  };
}

export function mapGiphyGifToDetails(gif: GiphyGif): GifDetails {
  const base = mapGiphyGifToItem(gif);
  const authorUsername =
    gif.user?.username?.trim() || gif.username?.trim() || '';
  const display =
    gif.user?.display_name?.trim() ||
    gif.user?.username?.trim() ||
    base.username;
  const profile = gif.user?.profile_url?.trim() ?? '';
  const original = pickOriginalUrl(gif.images);
  const w = gif.images?.original?.width ?? gif.images?.downsized?.width ?? '';
  const h = gif.images?.original?.height ?? gif.images?.downsized?.height ?? '';

  return {
    ...base,
    authorUsername,
    authorDisplayName: display,
    authorProfileUrl: profile,
    importDatetime: gif.import_datetime?.trim() ?? '',
    rating: gif.rating?.trim() ?? '',
    source: gif.source?.trim() ?? gif.source_tld?.trim() ?? '',
    originalUrl: original,
    originalWidth: w ? String(w) : '',
    originalHeight: h ? String(h) : '',
  };
}

export function gifMatchesAuthor(gif: GiphyGif, handle: string): boolean {
  const h = handle.trim().toLowerCase();
  if (!h) return false;
  const u = gif.user?.username?.trim().toLowerCase();
  if (u === h) return true;
  const legacy = gif.username?.trim().toLowerCase();
  return legacy === h;
}
