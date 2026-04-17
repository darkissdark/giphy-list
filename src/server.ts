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
  res.setHeader('X-Debug-SSR-Engine', 'angular-node-app-engine');
  // #region agent log
  fetch('http://127.0.0.1:7367/ingest/892d3f42-fe50-4aa8-b486-4b0c3b939b4a', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': '981d77',
    },
    body: JSON.stringify({
      sessionId: '981d77',
      runId: 'ssr-vs-static-home',
      hypothesisId: 'H1-H5',
      location: 'src/server.ts:ssr-handler',
      message: 'SSR wildcard route invoked',
      data: { url: req.originalUrl, method: req.method },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
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
