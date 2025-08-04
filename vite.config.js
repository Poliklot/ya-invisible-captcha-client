import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
	root: '.',
	publicDir: 'demos/public',
	server: {
		fs: {
			allow: ['.'],
		},
		open: 'demos/index.html',
		port: 3000,
		strictPort: false,
		proxy: {
			'/test-success': {
				target: 'http://localhost:3000',
				changeOrigin: true,
				selfHandleResponse: true,
				bypass(req, res) {
					if (req.method === 'POST') {
						let body = '';
						req.on('data', chunk => (body += chunk));
						req.on('end', () => {
							const token = new URLSearchParams(body).get('token');
							if (!token) {
								res.statusCode = 400;
								res.end(JSON.stringify({ error: 'Токен отсутствует' }));
							} else {
								res.statusCode = 200;
								res.end(JSON.stringify({ success: true }));
							}
						});
						return true; // Обрабатываем сами
					}
				},
			},
		},
	},
	build: {
		outDir: 'dist',
		emptyOutDir: true,
	},
});
