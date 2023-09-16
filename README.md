# SWR Loader

SWR Loader is a ux-centric way for achieving stale-while-revalidate in stream-capable data loaders. With it, you can leverage the user’s browser cache or a server-side cache to serve stale data while fetching new data in the background. This is especially useful for slow connections or when the user is offline while browsing your app.

## Getting Started

Install the package:

```bash
npm install swr-loader
```

## Usage

### Creating a SWR instance

```js
import { createSWR } from 'swr-loader';

export const { swr, invalidate } = createSWR({
	cacheAdapter: createIDBAdapter({ dbName: 'stargaze', storeName: 'data_cache' }),
	afterSet: data => {
		console.log('Data has been set in the cache:', data);
	},
});
```

### React-router example

Here’s an example of how you can cache filtered data.

```js
import { makeLoader, useLoaderData } from 'react-router-typesafe';
import { SWR } from "swr-loader";
import { swr } from './swr';

const loader = makeLoader(async () => {
    const searchParams = new URL(request.url).searchParams;
    const page = searchParams.get('page');
    const q = searchParams.get('q');

	return defer({
		posts: await swr({
			cacheKey: ['posts', 'list', JSON.stringify({search, q})],
			fetchFn: () => getPosts({search, q})
			maxAge: 5 * 1000, // 5 seconds
			onError: 'serve-stale', // serve stale data if there is an error fetching new data, e.g.: internet is down
		}),
	});
});

> **Note**
> You will have to `await` swr so that the ui-blocking part can be resolved (the cache) prior to rendering, but the fresh data will still be sent as an unfulfilled promise.

See the full example [here](/examples/vite-react).

// automatically handles cached data, loading states, and errors, obeys `onError` behaviour
const Component = () => {
    const { posts } = useLoaderData<typeof loader>();

    return <SWR
                data={posts}
                // will render when there is no cache and no data laoded yet
                loadingElement={<PostsSkeleton/>}
                // will render if there’s an error loading the data and there is no cache
                errorElement={<ErrorView heading="Error loading matches" />}
				>
					{posts => <ul>{posts.map(posts => <li key={post.id}>{post.title}</li>)}</ul>}
            </SWR>
}
```

### Invalidating the cache

You can use invalidation as part of actions or simply call it in your event handlers, if your app is not server-side rendered.

```js
import { invalidate } from './swr';

// invalidates only the posts list for page 1
invalidate(['posts', 'list', JSON.stringify({ page: '1', q: '' })]);

// invalidates all posts in listed
invalidate(['posts', 'list']);
```

## API

### `createSWR`

| Property       | Type                                              | Description                                           |
| -------------- | ------------------------------------------------- | ----------------------------------------------------- |
| `cacheAdapter` | `CacheAdapter`                                    | The cache adapter to use for storing data.            |
| `beforeGet`    | `(params: CacheAdapterFnParams) => Promise<void>` | A function to run before getting data from the cache. |
| `afterGet`     | `(data: unknown) => Promise<void>`                | A function to run after getting data from the cache.  |
| `beforeSet`    | `(params: CacheAdapterFnParams) => Promise<void>` | A function to run before setting data in the cache.   |
| `afterSet`     | `(data: unknown) => Promise<void>`                | A function to run after setting data in the cache.    |

## Adapters

### IndexedDB

Stores cached data in IndexedDB, has wide browser support. Client-side only, as IndexedDB is not available in server environments.

```js
import { createIDBAdapter } from 'swr-loader';

createIDBAdapter({ dbName: 'stargaze', storeName: 'data_cache' }),
```

### Redis

Coming Soon

### LocalStorage / SessionStorage

Coming Soon
