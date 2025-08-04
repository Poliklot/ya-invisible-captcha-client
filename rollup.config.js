import resolve from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import json from '@rollup/plugin-json';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import del from 'rollup-plugin-delete';
import copy from 'rollup-plugin-copy';
import dts from 'rollup-plugin-dts';
import commonjs from '@rollup/plugin-commonjs';

// ------------------------------------------------------------
// Настройки и константы
// ------------------------------------------------------------

/** Глобальное имя библиотеки для IIFE/UMD-сборки. Получится window.YaInvisibleCaptcha */
const LIB_NAME = 'YaInvisibleCaptcha';
/** Базовое имя файлов в dist/ */
const FILE_BASE = 'ya-invisible-captcha-client';

/** При `BUILD_TARGET=demos` дополнительно копируем dist/* → demos/public */
const isDemos = process.env.BUILD_TARGET === 'demos';

// ------------------------------------------------------------
// Конфигурации Rollup
// ------------------------------------------------------------

export default [
	// 1) JS-бандлы (ESM + CJS + IIFE + UMD)
	{
		input: 'src/index.ts',
		output: [
			{
				file: `dist/index.js`,
				format: 'es',
				sourcemap: true,
			},
			{
				file: `dist/index.cjs`,
				format: 'cjs',
				sourcemap: true,
			},
			{
				file: `dist/${FILE_BASE}.umd.js`,
				format: 'umd',
				name: LIB_NAME,
				sourcemap: true,
			},
			{
				file: `dist/${FILE_BASE}.min.js`,
				format: 'iife',
				name: LIB_NAME,
				sourcemap: true,
				plugins: [terser()],
			},
		],
		plugins: [
			del({
				targets: ['dist/*', isDemos ? 'demos/public/*' : null].filter(Boolean),
				verbose: true,
			}),
			resolve(),
			commonjs(),
			json(),
			typescript({
				tsconfig: 'tsconfig.json',
				clean: true,
				useTsconfigDeclarationDir: true,
			}),
			babel({
				babelHelpers: 'bundled',
				presets: [['@babel/preset-env', { modules: false }]],
				exclude: 'node_modules/**',
			}),
			isDemos &&
				copy({
					targets: [
						{
							src: [
								'dist/index.js',
								'dist/index.cjs',
								'dist/*.umd.js',
								'dist/*.min.js',
								'dist/*.map',
								'demos/index.html',
								'demos/demo-umd.html',
								'demos/demo-form-father.html',
								'demos/styles.css',
							],
							dest: 'demos/public',
						},
					],
					hook: 'writeBundle',
					overwrite: true,
				}),
		].filter(Boolean),
	},

	// 2) DTS-бандл
	{
		input: 'dist/types/index.d.ts',
		output: {
			file: 'dist/index.d.ts',
			format: 'es',
		},
		plugins: [dts()],
	},
];
