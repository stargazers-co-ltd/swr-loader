import { SWRCacheAdapter } from '../swr.utils';

// character code for emspace
const CACHE_KEY_SEPARATOR = '\x2003';

export const createMemoryAdapter = (): SWRCacheAdapter => {
	const cache = new Map<string, { updatedAt: number; data: unknown }>();

	return {
		get: async ({ cacheKey }) => {
			const cacheKeyString = cacheKey.join(CACHE_KEY_SEPARATOR);
			const cachedData = cache.get(cacheKeyString);
			return cachedData ?? null;
		},
		set: async ({ cacheKey, newCache }) => {
			const cacheKeyString = cacheKey.join(CACHE_KEY_SEPARATOR);
			const itemToUpdate = cache.get(cacheKeyString);
			if (itemToUpdate) {
				itemToUpdate.data = newCache.data;
				itemToUpdate.updatedAt = newCache.updatedAt;
			} else {
				cache.set(cacheKeyString, { data: newCache.data, updatedAt: newCache.updatedAt });
			}
		},
		invalidate: async partialCacheKey => {
			const partialCacheKeyString = partialCacheKey.join(CACHE_KEY_SEPARATOR);
			const keysToInvalidate = Array.from(cache.keys()).filter(key => {
				const hasCommonStart = key.startsWith(partialCacheKeyString);
				return hasCommonStart;
			});

			keysToInvalidate.forEach(key => {
				const row = cache.get(key);
				if (row) {
					row.updatedAt = 0;
				}
			});
		},
		reset: async () => {
			cache.clear();
		},
	};
};
