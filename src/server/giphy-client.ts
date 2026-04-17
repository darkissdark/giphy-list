import axios from 'axios';

import type { GiphySearchResponse, GiphySingleGifResponse } from '../app/giphy/giphy-api.types';

const BASE = 'https://api.giphy.com/v1/gifs';

export class GiphyClient {
  constructor(private readonly timeoutMs = 15_000) {}

  async search(params: {
    apiKey: string;
    q: string;
    limit: number;
    offset: number;
  }): Promise<GiphySearchResponse> {
    const { data } = await axios.get<GiphySearchResponse>(`${BASE}/search`, {
      params: {
        api_key: params.apiKey,
        q: params.q,
        limit: params.limit,
        offset: params.offset,
        lang: 'uk',
      },
      timeout: this.timeoutMs,
    });
    return data;
  }

  async trending(params: {
    apiKey: string;
    limit: number;
    offset: number;
  }): Promise<GiphySearchResponse> {
    const { data } = await axios.get<GiphySearchResponse>(`${BASE}/trending`, {
      params: {
        api_key: params.apiKey,
        limit: params.limit,
        offset: params.offset,
        rating: 'g',
      },
      timeout: this.timeoutMs,
    });
    return data;
  }

  async getById(apiKey: string, id: string): Promise<GiphySingleGifResponse> {
    const { data } = await axios.get<GiphySingleGifResponse>(`${BASE}/${encodeURIComponent(id)}`, {
      params: { api_key: apiKey },
      timeout: this.timeoutMs,
    });
    return data;
  }
}
