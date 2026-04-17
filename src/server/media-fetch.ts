import axios from 'axios';

export async function fetchBinaryFromUrl(
  url: string,
  timeoutMs = 60_000,
): Promise<{ data: ArrayBuffer; contentType: string }> {
  const res = await axios.get<ArrayBuffer>(url, {
    responseType: 'arraybuffer',
    timeout: timeoutMs,
    maxContentLength: 40 * 1024 * 1024,
  });
  const contentType =
    (res.headers['content-type'] as string) || 'application/octet-stream';
  return { data: res.data, contentType };
}
