import type express from 'express';
import type { GiphyControllers } from './giphy-controllers';

export function registerGiphyApiRoutes(
  app: express.Application,
  c: GiphyControllers,
): void {
  app.get('/api/gifs/search', c.search);
  app.get('/api/gifs/trending', c.trending);
  app.get('/api/gifs/download', c.download);
  app.get('/api/gifs/by-user', c.byUser);
  app.get('/api/gifs/:id', c.getById);
}
