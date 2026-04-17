export interface GiphyImages {
  fixed_height?: { url?: string; webp?: string; width?: string; height?: string };
  fixed_height_webp?: { url?: string; width?: string; height?: string };
  fixed_width_small?: { url?: string; webp?: string; width?: string; height?: string };
  fixed_width?: { url?: string; webp?: string; width?: string; height?: string };
  downsized?: { url?: string; webp?: string; width?: string; height?: string };
  original?: { url?: string; webp?: string; width?: string; height?: string };
}

export interface GiphyUser {
  username?: string;
  display_name?: string;
  profile_url?: string;
  avatar_url?: string;
}

export interface GiphyGif {
  id: string;
  title?: string;
  alt_text?: string;
  username?: string;
  rating?: string;
  import_datetime?: string;
  url?: string;
  bitly_gif_url?: string;
  source?: string;
  source_tld?: string;
  user?: GiphyUser;
  images?: GiphyImages;
}

export interface GiphySearchResponse {
  data: GiphyGif[];
  pagination?: { total_count?: number; count?: number; offset?: number };
}

export interface GiphySingleGifResponse {
  data: GiphyGif;
}
