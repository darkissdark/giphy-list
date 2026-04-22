type GifItem = {
  id: string;
  title: string;
  alt: string;
  previewUrl: string;
  webpUrl: string;
  shareUrl: string;
  username: string;
  width: number;
  height: number;
};

export function createGifItem(id: string, suffix: string): GifItem {
  return {
    id,
    title: `GIF ${suffix}`,
    alt: `Alt text ${suffix}`,
    previewUrl: `https://media1.giphy.com/media/${id}/preview.gif`,
    webpUrl: `https://media1.giphy.com/media/${id}/preview.webp`,
    shareUrl: `https://giphy.com/gifs/${id}`,
    username: `author_${suffix}`,
    width: 320,
    height: 240,
  };
}

export function createGifItems(count: number, prefix: string): GifItem[] {
  return Array.from({ length: count }, (_, idx) => {
    const index = idx + 1;
    return createGifItem(`${prefix}-${index}`, `${prefix}-${index}`);
  });
}
