import { defineConfig } from 'tsup';

export default defineConfig({
	entry: ['src/index.ts', 'src/adapters/*.ts'],
	clean: true,
	dts: true,
	format: ['esm', 'cjs'],
	external: ['react-router-dom', 'react'],
});
