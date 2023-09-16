import { createSWR } from 'swr-loader';
import { createIDBAdapter } from 'swr-loader/adapters/idb';

const idbAdapter = createIDBAdapter({ dbName: 'demo', storeName: 'data_cache' });

export const { swr, invalidate } = createSWR({
	cacheAdapter: idbAdapter,
});
