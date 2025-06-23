import { useCallback } from 'react';

// Clave para localStorage
const CACHE_KEY = 'report-image-cache-v1';
// Tamaño máximo del cache (en imágenes)
const MAX_CACHE_SIZE = 50;

// Estructura del cache: { [url]: { data: string (base64), timestamp: number } }
function loadCache(): Record<string, { data: string; timestamp: number }> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveCache(cache: Record<string, { data: string; timestamp: number }>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {}
}

// Singleton cache in memory
const memoryCache: Record<string, { data: string; timestamp: number }> = loadCache();

export function useReportImageCache() {
  // Obtiene la imagen cacheada (base64) o null
  const getImage = useCallback((url: string): string | null => {
    if (!url) return null;
    const entry = memoryCache[url];
    return entry ? entry.data : null;
  }, []);

  // Guarda una imagen en el cache (base64)
  const setImage = useCallback((url: string, base64: string) => {
    if (!url || !base64) return;
    memoryCache[url] = { data: base64, timestamp: Date.now() };
    // Limpiar si excede el tamaño máximo
    const keys = Object.keys(memoryCache);
    if (keys.length > MAX_CACHE_SIZE) {
      // Ordenar por timestamp y eliminar los más viejos
      const sorted = keys.sort((a, b) => (memoryCache[a].timestamp - memoryCache[b].timestamp));
      for (let i = 0; i < keys.length - MAX_CACHE_SIZE; i++) {
        delete memoryCache[sorted[i]];
      }
    }
    saveCache(memoryCache);
  }, []);

  // Descarga una imagen y la guarda en cache (devuelve base64)
  const fetchAndCacheImage = useCallback(async (url: string): Promise<string | null> => {
    if (!url) return null;
    // Ya en cache
    const cached = getImage(url);
    if (cached) return cached;
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      setImage(url, base64);
      return base64;
    } catch {
      return null;
    }
  }, [getImage, setImage]);

  // Limpia todo el cache
  const clearCache = useCallback(() => {
    Object.keys(memoryCache).forEach((k) => delete memoryCache[k]);
    saveCache(memoryCache);
  }, []);

  return { getImage, setImage, fetchAndCacheImage, clearCache };
} 