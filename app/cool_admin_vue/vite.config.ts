import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import { ConfigEnv, Plugin, UserConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import compression from 'vite-plugin-compression';
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite';
import vueDevTools from 'vite-plugin-vue-devtools';
import { visualizer } from 'rollup-plugin-visualizer';
import { proxy } from './src/config/proxy';
import { cool } from '@cool-vue/vite-plugin';

function toPath(dir: string) {
	return fileURLToPath(new URL(dir, import.meta.url));
}

// C 端本地图片目录（推文封面等静态资源）
const cImagesDir = toPath('../wu_dong_vue/public/images');

const imageMime: Record<string, string> = {
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.png': 'image/png',
	'.gif': 'image/gif',
	'.webp': 'image/webp',
	'.svg': 'image/svg+xml',
	'.avif': 'image/avif'
};

/**
 * 管理端预览 C 端图片资源
 * dev：将 /images 请求映射到 wu_dong_vue/public/images
 * build：构建时把该目录复制到产物 dist/images
 */
function wudongCImages(): Plugin {
	return {
		name: 'wudong-c-images',
		configureServer(server) {
			server.middlewares.use('/images', (req, res, next) => {
				const rel = decodeURIComponent((req.url || '').split('?')[0]).replace(/^\/+/, '');
				const file = path.join(cImagesDir, rel);

				if (
					!file.startsWith(cImagesDir) ||
					!fs.existsSync(file) ||
					!fs.statSync(file).isFile()
				) {
					next();
					return;
				}

				res.setHeader(
					'Content-Type',
					imageMime[path.extname(file).toLowerCase()] || 'application/octet-stream'
				);
				res.setHeader('Cache-Control', 'public, max-age=86400');
				fs.createReadStream(file).pipe(res);
			});
		},
		writeBundle() {
			if (fs.existsSync(cImagesDir)) {
				fs.cpSync(cImagesDir, toPath('./dist/images'), { recursive: true });
			}
		}
	};
}

// https://vitejs.dev/config
export default ({ mode }: ConfigEnv): UserConfig => {
	const isDev = mode === 'development';

	return {
		plugins: [
			vue(),
			compression(),
			vueJsx(),
			wudongCImages(),
			// vueDevTools(),
			cool({
				type: 'admin',
				proxy,
				eps: {
					enable: true
				},
				svg: {
					skipNames: ['base', 'theme']
				},
				demo: mode == 'demo' // 是否开启演示模式
			}),
			// visualizer({
			// 	open: false,
			// 	gzipSize: true,
			// 	brotliSize: true
			// }),
			VueI18nPlugin({
				include: [toPath('./src/{modules,plugins}/**/locales/**')]
			})
		],
		base: '/',
		server: {
			port: 9000,
			proxy,
			hmr: {
				overlay: true
			}
		},
		css: {
			preprocessorOptions: {
				scss: {
					charset: false,
					api: 'modern-compiler'
				}
			}
		},
		resolve: {
			alias: {
				'/@': toPath('./src'),
				'/$': toPath('./src/modules'),
				'/#': toPath('./src/plugins'),
				'/~': toPath('./packages')
			}
		},
		esbuild: {
			drop: isDev ? [] : ['console', 'debugger']
		},
		build: {
			minify: 'esbuild',
			// terserOptions: {
			// 	compress: {
			// 		drop_console: true,
			// 		drop_debugger: true
			// 	}
			// },
			sourcemap: isDev,
			rollupOptions: {
				output: {
					chunkFileNames: 'static/js/[name]-[hash].js',
					entryFileNames: 'static/js/[name]-[hash].js',
					assetFileNames: 'static/[ext]/[name]-[hash].[ext]',
					manualChunks(id) {
						if (id.includes('node_modules')) {
							if (!['@cool-vue/crud'].find(e => id.includes(e))) {
								if (id.includes('prettier')) {
									return;
								}

								return id
									.toString()
									.split('node_modules/')[1]
									.replace('.pnpm/', '')
									.split('/')[0];
							} else {
								return 'comm';
							}
						}
					}
				}
			}
		}
	};
};
