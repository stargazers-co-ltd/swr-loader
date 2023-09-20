import { createSWR } from 'swr-loader';
import { createMemoryAdapter } from 'swr-loader/adapters/memory';

// const idbAdapter = createIDBAdapter({ dbName: 'demo', storeName: 'data_cache' });
// const zustandAdapter = createZustandAdapter({ createStore });

export const { swr, invalidate } = createSWR({
	cacheAdapter: createMemoryAdapter(),
});
