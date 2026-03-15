export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 1,
): Promise<Response> {
  try {
    return await fetch(url, options);
  } catch (error) {
    if (retries > 0) return fetchWithRetry(url, options, retries - 1);
    throw error;
  }
}
