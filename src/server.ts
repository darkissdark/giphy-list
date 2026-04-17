import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';

import { config as loadEnv } from 'dotenv';
import express from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { registerGiphyApiRoutes } from './server/api-routes';
import { GiphyClient } from './server/giphy-client';
import { createGiphyControllers } from './server/giphy-controllers';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');
const projectRoot = resolve(serverDistFolder, '../..');

loadEnv({ path: resolve(projectRoot, '.env') });
loadEnv({ path: resolve(process.cwd(), '.env') });

const app = express();
const angularApp = new AngularNodeAppEngine();

const giphyClient = new GiphyClient();
const giphyControllers = createGiphyControllers(giphyClient);
registerGiphyApiRoutes(app, giphyControllers);

app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

app.use('/**', (req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
