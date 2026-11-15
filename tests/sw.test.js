const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function worker() {
  const handlers = {};
  const stores = new Map();
  let online = true;
  let content = 'version initiale';
  let skipped = false;
  let claimed = false;
  const caches = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name);
      return {
        async addAll(requests) {
          for (const request of requests) {
            assert.equal(request.cache, 'reload');
            store.set(request.url, new Response(content));
          }
        },
        async put(key, response) { store.set(key, response); },
        async match(key) { return store.get(key)?.clone(); }
      };
    },
    async keys() { return [...stores.keys()]; },
    async delete(name) { return stores.delete(name); }
  };
  const self = {
    registration: { scope: 'https://example.test/appecam/' },
    addEventListener(type, handler) { handlers[type] = handler; },
    async skipWaiting() { skipped = true; },
    clients: { async claim() { claimed = true; } }
  };
  vm.runInNewContext(fs.readFileSync('sw.js', 'utf8'), {
    self, caches, URL, Request, console,
    fetch: async (_request, options) => {
      assert.equal(options.cache, 'no-store');
      if (!online) throw new TypeError('offline');
      return new Response(content);
    }
  });
  return {
    stores,
    setContent(value) { content = value; },
    setOnline(value) { online = value; },
    async dispatch(type, data = {}) {
      let pending;
      handlers[type]({
        ...data,
        waitUntil(promise) { pending = promise; },
        respondWith(promise) { pending = promise; }
      });
      return pending && await pending;
    },
    get skipped() { return skipped; },
    get claimed() { return claimed; }
  };
}

test('installation and activation replace only the application cache', async () => {
  const sw = worker();
  sw.stores.set('chromakey-v1', new Map());
  sw.stores.set('another-app', new Map());
  await sw.dispatch('install');
  await sw.dispatch('activate');
  assert.equal(sw.skipped, true);
  assert.equal(sw.claimed, true);
  assert.equal(sw.stores.has('chromakey-v1'), false);
  assert.equal(sw.stores.has('another-app'), true);
});

test('online navigation refreshes both page URLs and offline uses the latest copy', async () => {
  const sw = worker();
  await sw.dispatch('install');
  sw.setContent('nouvelle version');
  const online = await sw.dispatch('fetch', {
    request: new Request('https://example.test/appecam/?source=app')
  });
  assert.equal(await online.text(), 'nouvelle version');
  sw.setOnline(false);
  const offline = await sw.dispatch('fetch', {
    request: new Request('https://example.test/appecam/index.html')
  });
  assert.equal(await offline.text(), 'nouvelle version');
});

test('the installed page is available offline before any later online navigation', async () => {
  const sw = worker();
  await sw.dispatch('install');
  sw.setOnline(false);
  const response = await sw.dispatch('fetch', {
    request: new Request('https://example.test/appecam/index.html')
  });
  assert.equal(await response.text(), 'version initiale');
});

test('requests outside the application assets are not intercepted', async () => {
  const sw = worker();
  const response = await sw.dispatch('fetch', {
    request: new Request('https://example.test/other')
  });
  assert.equal(response, undefined);
});
