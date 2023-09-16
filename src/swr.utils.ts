import type {
	HandledSWRData,
	PotentiallyPromise,
	SWRCacheKey,
	SWRData,
	SWRErrorBehaviour,
	SWRResponseWithStatus,
} from './swr.types';

type SWROptions<TData, TError extends SWRErrorBehaviour = SWRErrorBehaviour> = {
	/** Time **in milliseconds** which the data is made stale and replaced in cache. */
	maxAge: number;
	cacheKey: SWRCacheKey;
	fetchFn: (cacheKey: SWRCacheKey) => PotentiallyPromise<TData>;
	onError: TError;
};

type CacheAdapterFnParams = Pick<SWROptions<unknown>, 'cacheKey' | 'onError' | 'maxAge'>;

export type SWRCacheAdapter = {
	get: (params: Pick<CacheAdapterFnParams, 'cacheKey'>) => PotentiallyPromise<{ updatedAt: number; data: any } | null>;
	set: (
		params: Pick<CacheAdapterFnParams, 'cacheKey'> & { newCache: { updatedAt: number; data: any } },
	) => PotentiallyPromise<void>;
	invalidate: (cacheKey: SWRCacheKey) => PotentiallyPromise<void>;

	clear: (cacheKey: SWRCacheKey) => PotentiallyPromise<void>;
	reset: () => PotentiallyPromise<void>;
};

export type CreateSWRLoaderParams = {
	cacheAdapter: SWRCacheAdapter;
	beforeGet?: (params: CacheAdapterFnParams) => void;
	beforeSet?: (params: CacheAdapterFnParams) => void;
	afterGet?: (data: unknown) => void;
	afterSet?: (data: unknown) => void;
};

const shouldServeStaleData = (errorBehaviour: SWRErrorBehaviour): errorBehaviour is 'serve-stale' =>
	errorBehaviour === 'serve-stale';

export const createSWR = (params: CreateSWRLoaderParams) => {
	const swr = async <T, E extends SWRErrorBehaviour>(cacheOptions: SWROptions<T, E>): Promise<SWRData<T, E>> => {
		params.beforeGet?.(cacheOptions);
		const dataFromCache = await params.cacheAdapter.get(cacheOptions);
		params.afterGet?.(dataFromCache);

		return {
			cached: dataFromCache ? { ...dataFromCache, status: 'cached' } : null,
			fresh: (async () => {
				const needsRevalidation = !dataFromCache || Date.now() - dataFromCache.updatedAt > cacheOptions.maxAge;
				if (!needsRevalidation) return { ...dataFromCache, status: 'cached' };

				try {
					params.beforeSet?.(cacheOptions);
					const data = await cacheOptions.fetchFn(cacheOptions.cacheKey);
					params.cacheAdapter.set({
						cacheKey: cacheOptions.cacheKey,
						newCache: {
							updatedAt: new Date().getTime(),
							data,
						},
					});
					params.afterSet?.(data);
					return {
						status: 'fresh',
						updatedAt: new Date().getTime(),
						data,
					};
				} catch (error) {
					if (shouldServeStaleData(cacheOptions.onError)) {
						if (dataFromCache) {
							return { ...dataFromCache, status: 'stale' };
						}
						return null;
					}
					throw error;
				}
			})() as unknown as HandledSWRData<E, SWRResponseWithStatus<T>>,
			_onError: cacheOptions.onError,
		};
	};

	const mutate = async <T>(mutateParams: { data: T; cacheOptions: Pick<SWROptions<T>, 'cacheKey'> }) => {
		const updatedAt = new Date().getTime();
		await params.cacheAdapter.set({
			cacheKey: mutateParams.cacheOptions.cacheKey,
			newCache: {
				updatedAt,
				data: mutateParams.data,
			},
		});
	};

	return { swr, invalidate: params.cacheAdapter.invalidate, mutate };
};
