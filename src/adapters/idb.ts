import { openDB } from 'idb';
import { SWRCacheAdapter } from '../swr.utils';

export type ObjectWithCacheKeys = {
	cacheKey1: string;
	cacheKey2: string;
	cacheKey3: string;
	cacheKey4: string;
	cacheKey5: string;
};

/** Returns an object with `cacheKey${1 | 2 | 3 | 4 | 5}` and their respective cache positions, in the key array.
 * If not present, fills them with empty strings.
 */
const getCacheKeysObj = (key: string[]): ObjectWithCacheKeys => {
	if (!Array.isArray(key)) throw new Error('Cache key must be an array of strings or numbers');
	if (!(typeof key[0] === 'string')) throw new Error('First cache key must be a string');
	return {
		cacheKey1: key[0] ?? '',
		cacheKey2: key[1] ?? '',
		cacheKey3: key[2] ?? '',
		cacheKey4: key[3] ?? '',
		cacheKey5: key[4] ?? '',
	};
};

export type CreateIDBAdapterParams = {
	dbName: string;
	storeName: string;
};
export const createIDBAdapter = (params: CreateIDBAdapterParams) => {
	const dbPromise = openDB(params.dbName, 1, {
		upgrade(db, _oldVersion, _newVersion, _transaction, _event) {
			db.createObjectStore(params.storeName, {
				keyPath: ['cacheKey1', 'cacheKey2', 'cacheKey3', 'cacheKey4', 'cacheKey5'],
			});
		},
	});

	const idbAdapter: SWRCacheAdapter = {
		get: async ({ cacheKey }) => {
			/** We fill the key array with empty strings until it has length 5 */
			const normalisedKey = cacheKey.concat(Array(5 - cacheKey.length).fill(''));

			const db = await dbPromise;
			const cachedData = await db.get(params.storeName, normalisedKey);
			if (!cachedData) return null;

			return { data: cachedData.data, updatedAt: cachedData.updatedAt };
		},
		set: async ({ cacheKey, newCache }) => {
			const cacheKeys = getCacheKeysObj(cacheKey);
			/** We add cache keys to the newCache object so it can be indexed */
			Object.assign(newCache, cacheKeys);
			const db = await dbPromise;
			await db.put(params.storeName, newCache);
		},
		invalidate: async cacheKey => {
			const db = await dbPromise;

			const matches = await db.getAllKeys(params.storeName, IDBKeyRange.lowerBound(cacheKey));

			for await (const key of matches) {
				const value = await db.get(params.storeName, key);
				if (!value) continue;
				value.updatedAt = 0;
				await db.put(params.storeName, value);
			}
		},
		clear: async (key: IDBValidKey[]) => {
			const db = await dbPromise;
			return db.delete(params.storeName, IDBKeyRange.lowerBound(key));
		},
		reset: async () => {
			const db = await dbPromise;
			return db.clear(params.storeName);
		},
	};

	return idbAdapter;
};
