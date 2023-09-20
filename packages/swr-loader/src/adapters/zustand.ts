import { createStore } from 'zustand';
import { SWRCacheAdapter } from '../swr.utils';
import { equals, intersection } from 'remeda';

export type CacheStore = {
	cache: { key: string[]; data: unknown; updatedAt: number }[];
};

export type CreateZustandAdapterParams = {
	createStore: typeof createStore;
};

export const createZustandAdapter = ({ createStore }: CreateZustandAdapterParams): SWRCacheAdapter => {
	const cacheStore = createStore<CacheStore>(() => ({
		cache: [],
	}));

	return {
		get: async ({ cacheKey }) => {
			const cachedData = cacheStore.getState().cache.find(({ key }) => equals(key, cacheKey));

			if (!cachedData) return null;
			return { updatedAt: cachedData.updatedAt, data: cachedData.data };
		},
		set: async ({ cacheKey, newCache }) => {
			cacheStore.setState(state => {
				const draft = structuredClone(state.cache);
				const itemToUpdate = draft.find(({ key }) => equals(key, cacheKey));
				if (itemToUpdate) {
					itemToUpdate.data = newCache.data;
					itemToUpdate.updatedAt = newCache.updatedAt;
				} else {
					draft.push({ key: cacheKey, data: newCache.data, updatedAt: newCache.updatedAt });
				}
				return { cache: draft };
			});
		},
		invalidate: async partialCacheKey => {
			cacheStore.setState(state => {
				const itemsToInvalidate = state.cache.filter(({ key }) => {
					const hasCommonStart = !intersection(key, partialCacheKey).some((k, i) => k !== partialCacheKey[i]);
					return hasCommonStart;
				});
				itemsToInvalidate.forEach(item => {
					item.updatedAt = 0;
				});
				return structuredClone(state);
			});
		},
		reset: async () => {
			cacheStore.setState({ cache: [] });
		},
	};
};
