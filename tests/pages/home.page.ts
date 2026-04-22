import { type Locator, type Page, expect } from '@playwright/test';

export class HomePage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
  }

  searchInput(): Locator {
    return this.page.getByRole('searchbox', { name: 'Search keyword' });
  }

  resultsGrid(): Locator {
    return this.page.locator('section[aria-label="Search results"]');
  }

  trendingGrid(): Locator {
    return this.page.locator('section[aria-label="Trending GIFs"]');
  }

  gifLinks(): Locator {
    return this.page.getByRole('link', { name: /Open GIF page:/ });
  }

  loadMoreButton(): Locator {
    return this.page.getByRole('button', { name: 'Load more' });
  }

  async search(query: string) {
    await this.searchInput().fill(query);
  }

  async waitForCardsAtLeast(count: number) {
    await expect(this.gifLinks()).toHaveCount(count);
  }
}
