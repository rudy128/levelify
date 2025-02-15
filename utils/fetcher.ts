export async function fetchWithJson<T>(url: string, options?: RequestInit): Promise<T | null> {
    const response = await fetch(url, options);
  
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  
    if (response.status === 204 || response.headers.get('Content-Length') === '0') {
      return null;
    }
  
    try {
      return await response.json();
    } catch (error) {
      console.error('Failed to parse JSON:', error);
      return null;
    }
  }
  