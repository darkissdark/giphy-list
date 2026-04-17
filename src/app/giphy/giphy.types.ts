import type { GiphyGif } from './giphy-api.types';

export interface GifItem {
  id: string;
  title: string;
  alt: string;
  previewUrl: string;
  webpUrl: string;
  shareUrl: string;
  username: string;
  width: number;
  height: number;
}

export interface GifDetails extends GifItem {
  authorUsername: string;
  authorDisplayName: string;
  authorProfileUrl: string;
  importDatetime: string;
  rating: string;
  source: string;
  originalUrl: string;
  originalWidth: string;
  originalHeight: string;
}

export function isGiphyGif(value: unknown): value is GiphyGif {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof (value as GiphyGif).id === 'string'
  );
}
