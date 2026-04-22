import { expect, test } from '@playwright/test';

const hasApiKey = Boolean(process.env['GIPHY_API_KEY']?.trim());

test.describe('@api giphy REST endpoints', () => {
  test.skip(!hasApiKey, 'Set GIPHY_API_KEY to run API happy-path tests.');

  test('GET /api/gifs/search returns items and totalCount', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/api/gifs/search`, {
      params: { q: 'cat', limit: '3', offset: '0' },
    });

    expect(response.ok()).toBeTruthy();
    const body = (await response.json()) as {
      items: Record<string, unknown>[];
      totalCount: number;
    };

    expect(Array.isArray(body.items)).toBeTruthy();
    expect(body.items.length).toBeGreaterThan(0);
    expect(typeof body.totalCount).toBe('number');

    const first = body.items[0] ?? {};
    expect(typeof first['id']).toBe('string');
    expect(typeof first['title']).toBe('string');
    expect(typeof first['previewUrl']).toBe('string');
  });

  test('GET /api/gifs/search without q returns contract error', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/api/gifs/search`);
    expect(response.status()).toBe(400);

    const body = (await response.json()) as {
      error: { code: string; message: string; status: number };
    };
    expect(body.error.code).toBe('BAD_REQUEST');
    expect(body.error.message).toContain('Parameter q is required');
    expect(body.error.status).toBe(400);
  });

  test('GET /api/gifs/trending returns list payload', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/api/gifs/trending`, {
      params: { limit: '5', offset: '0' },
    });
    expect(response.ok()).toBeTruthy();

    const body = (await response.json()) as {
      items: Record<string, unknown>[];
      totalCount: number;
    };
    expect(Array.isArray(body.items)).toBeTruthy();
    expect(typeof body.totalCount).toBe('number');
  });

  test('GET /api/gifs/:id for missing gif returns 404', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/api/gifs/not-existing-id-123456789`);
    expect(response.status()).toBe(404);

    const body = (await response.json()) as {
      error: { code: string; message: string; status: number };
    };
    expect(body.error.code).toBe('UPSTREAM');
    expect(body.error.status).toBe(404);
  });
});
