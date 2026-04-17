import handlerModule from '../dist/giphy-list/server/server.mjs';

const reqHandler =
  typeof handlerModule?.reqHandler === 'function'
    ? handlerModule.reqHandler
    : typeof handlerModule?.default === 'function'
      ? handlerModule.default
      : null;

if (!reqHandler) {
  throw new Error('SSR request handler not found in dist/giphy-list/server/server.mjs');
}

export default reqHandler;
