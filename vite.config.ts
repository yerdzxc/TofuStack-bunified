import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [
		{
			name: 'error-logger',
			buildStart() {
				console.log('Build starting...');
			},
			closeBundle() {
				console.log('Bundle closed');
			},
			closeBuild() {
				console.log('Build closed');
			}
		},
		sveltekit({
			compilerOptions: {
				warningsAsErrors: false
			}
		})
	],
	esbuild: {
		target: 'es2022'
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
