export type PotentiallyPromise<T> = T | Promise<T>;

/**
 * What to do if an error is thrown when fetching fresh data.
 * - `throw`: Throw the error.
 * - `serve-stale`: Prevent throwing and serve stale data if available.
 */
export type SWRErrorBehaviour = 'throw' | 'serve-stale';

export type HandledSWRData<E extends SWRErrorBehaviour, T> = E extends 'serve-stale' ? T | null : T;

/**
 * The status of the cache for the data returned.
 * - `fresh`: The data is fresh
 * - `cached`: The data was reused from the cache
 * - `stale`: The data was reused from the cache while failing to fetch fresh data
 */
export type SWRDataStatus = 'fresh' | 'cached' | 'stale';

export type SWRResponse<T> = {
	updatedAt: number;
	data: T;
};

export type SWRResponseWithStatus<T> = SWRResponse<T> & {
	status: SWRDataStatus;
};

export type SWRCacheKey = string[];

export type SWRData<T, E extends SWRErrorBehaviour> = {
	cached: SWRResponseWithStatus<T> | null;
	fresh: PotentiallyPromise<HandledSWRData<E, SWRResponseWithStatus<T>>>;
	_onError: E;
};
