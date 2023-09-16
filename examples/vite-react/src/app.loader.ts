import { defer, makeLoader } from 'react-router-typesafe';
import { swr } from './cache';

const getDemoData = async () => {
	await new Promise(resolve => setTimeout(resolve, 1000 * 2));
	return { message: 'I was fetched at ' + new Date().toISOString() };
};

export const loader = makeLoader(async () => {
	return defer({
		demo: await swr({ cacheKey: ['demo'], maxAge: 1000 * 10, onError: 'throw', fetchFn: getDemoData }),
	});
});
