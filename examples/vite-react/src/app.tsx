import { useLoaderData } from 'react-router-typesafe';
import { SWR } from 'swr-loader/react';
import './App.css';
import { loader } from './app.loader';

function App() {
	const { demo } = useLoaderData<typeof loader>();

	return (
		<main>
			<h1>SWR Loader on Vite + React</h1>
			<div className="card">
				<SWR data={demo} loadingElement={'Loading…'} errorElement={'Error!'}>
					{demo => {
						return (
							<dl>
								<dt>{demo.data.message}</dt>
								<dd>Data is: {demo.status}</dd>
							</dl>
						);
					}}
				</SWR>
			</div>
		</main>
	);
}

export default App;
