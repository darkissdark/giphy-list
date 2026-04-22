import { createGifItems } from '../fixtures/gif-data';
import { expect, test } from '../fixtures/test.fixture';

test.describe('Home page E2E', () => {
  test('search switches from trending list to search results', async ({ homePage, page }) => {
    const trendingItems = createGifItems(4, 'trending');
    const searchItems = createGifItems(2, 'search');

    await page.route('**/api/gifs/trending**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: trendingItems, totalCount: 4 }),
      });
    });

    await page.route('**/api/gifs/search**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: searchItems, totalCount: 2 }),
      });
    });

    await homePage.goto();
    await expect(homePage.trendingGrid()).toBeVisible();
    const initialCardCount = await homePage.gifLinks().count();
    expect(initialCardCount).toBeGreaterThan(0);

    await homePage.search('cats');
    await expect(homePage.resultsGrid()).toBeVisible();
    await expect(homePage.trendingGrid()).toBeHidden();
    await expect(homePage.gifLinks()).toHaveCount(2);
  });

  test('load more appends new cards for search results', async ({ homePage, page }) => {
    const firstPage = createGifItems(16, 'banana-a');
    const secondPage = createGifItems(4, 'banana-b');

    await page.route('**/api/gifs/trending**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: createGifItems(1, 'seed'), totalCount: 1 }),
      });
    });

    await page.route('**/api/gifs/search**', async (route) => {
      const requestUrl = new URL(route.request().url());
      const offset = Number(requestUrl.searchParams.get('offset') ?? '0');
      const body =
        offset === 0
          ? { items: firstPage, totalCount: 20 }
          : { items: secondPage, totalCount: 20 };

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
    });

    await homePage.goto();
    await homePage.search('banana');
    await expect(homePage.gifLinks()).toHaveCount(16);
    await expect(homePage.loadMoreButton()).toBeVisible();

    await homePage.loadMoreButton().click();
    await expect(homePage.gifLinks()).toHaveCount(20);
    await expect(homePage.loadMoreButton()).toBeHidden();
  });

  test('responsive smoke keeps key controls visible', async ({ homePage, page }) => {
    await page.route('**/api/gifs/trending**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: createGifItems(3, 'responsive'), totalCount: 3 }),
      });
    });

    await homePage.goto();
    await expect(homePage.searchInput()).toBeVisible();
    await homePage.search('smoke');
    await expect(homePage.searchInput()).toHaveValue('smoke');
    await expect(page.locator('#main-content')).toBeVisible();
  });
});
