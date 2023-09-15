import { Suspense } from 'react';
import { Await } from 'react-router-dom';

import type { HandledSWRData, SWRData, SWRErrorBehaviour, SWRResponseWithStatus } from '../swr.types';

export const SWR = <TError extends SWRErrorBehaviour, TData>({
	data,
	children,
	...props
}: {
	data: SWRData<TData, TError>;
	loadingElement: React.ReactNode;
	errorElement: React.ReactNode;
	children: (resolved: HandledSWRData<TError, SWRResponseWithStatus<TData>>) => React.ReactNode;
}) => {
	return (
		<Suspense fallback={data.cached ? children(data.cached) : props.loadingElement}>
			<Await
				resolve={data.fresh}
				errorElement={data._onError === 'serve-stale' && data.cached ? children(data.cached) : props.errorElement}
			>
				{children}
			</Await>
		</Suspense>
	);
};
