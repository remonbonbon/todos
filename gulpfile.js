/*eslint strict: [2, "global"]*/
'use strict';
const gulp = require('gulp');
const plumber = require('gulp-plumber');
const gulpWebpack = require('webpack-stream');
const webpack = require('webpack-stream').webpack;
const jade = require('gulp-jade');
const sass = require('gulp-sass');
const rename = require('gulp-rename');
const eslint = require('gulp-eslint');

// Source and output pathes
const BUILD = {
	server: {
		watch: './*.js',
	},
	js: {
		entry: './src/app.js',
		watch: './src/**/*.js',
		dest: './build/',
		output: 'bundle.js',
	},
	html: {
		entry: './src/index.jade',
		watch: './src/**/*.jade',
		dest: './build/',
		output: 'index.html',
	},
	css: {
		entry: './src/app.scss',
		watch: './src/**/*.scss',
		dest: './build/',
		output: 'bundle.css',
	},
	staticFiles: [
		{
			files: ['./node_modules/font-awesome/fonts/*'],
			dest: './build/fonts/',
		},
	],
};

// ---------- Switch to debug build ----------
var debug = false;
gulp.task('debug', () => debug = true);

// ---------- ESlint ----------
gulp.task('eslint-server', () => gulp.src(BUILD.server.watch)
	.pipe(eslint('.eslintrc'))
	.pipe(eslint.format())
);
gulp.task('eslint-client', () => gulp.src(BUILD.js.watch)
	.pipe(eslint('.eslintrc'))
	.pipe(eslint.format())
);
gulp.task('eslint', ['eslint-server', 'eslint-client']);

gulp.task('watch-eslint-server', () =>
	gulp.watch(BUILD.server.watch, ['eslint-server']));
gulp.task('watch-eslint-client', () =>
	gulp.watch(BUILD.js.watch, ['eslint-client']));
gulp.task('watch-eslint', ['watch-eslint-server', 'watch-eslint-client']);

// ---------- Build JavaScript ----------
var watchWebpack = false;
gulp.task('webpack', () => gulp.src(BUILD.js.entry)
	.pipe(plumber())
	.pipe(gulpWebpack({
		watch: watchWebpack,
		output: {
			filename: BUILD.js.output
		},
		module: {
			loaders: [{
				test: /\.js$/,
				exclude: /(node_modules)/,
				loader: 'babel',
				query: {
					presets: ['es2015']
				}
			}]
		},
		plugins: [
			debug ? null : new webpack.optimize.UglifyJsPlugin({
				compress: {warnings: false}
			}),
			// Forced to production for 3rd-party modules.
			new webpack.DefinePlugin({
				'process.env': {
					NODE_ENV: '"production"'
				}
			}),
		].filter((p) => p),
	}, null, (err, stats) => {
		console.log(stats.toString({
			colors: true,
			hash: false,
			version: false,
			timings: true,
			assets: true,
			chunks: false,
			modules: false,
			cachedAssets: false,
		}));
	}))
	.pipe(gulp.dest(BUILD.js.dest))
);
gulp.task('watch-webpack', () => watchWebpack = true);

// ---------- Build HTML ----------
gulp.task('jade', () => gulp.src(BUILD.html.entry)
	.pipe(plumber())
	.pipe(jade({
		pretty: debug,
	}))
	.pipe(gulp.dest(BUILD.html.dest))
);
gulp.task('watch-jade', () => gulp.watch(BUILD.html.watch, ['jade']));

// ---------- Build CSS ----------
gulp.task('sass', () => gulp.src(BUILD.css.entry)
	.pipe(sass({
		outputStyle: debug ? 'expanded' : 'compressed'
	}).on('error', sass.logError))
	.pipe(rename(BUILD.css.output))
	.pipe(gulp.dest(BUILD.css.dest))
);
gulp.task('watch-sass', () => gulp.watch(BUILD.css.watch, ['sass']));

// ---------- Static files ----------
var staticTasks = [];
var staticWatches = [];
BUILD.staticFiles.forEach((s, index) => {
	const taskName = 'static' + index;
	const watchName = 'watch-' + taskName;
	gulp.task(taskName, () => gulp.src(s.files).pipe(gulp.dest(s.dest)));
	gulp.task(watchName, () => gulp.watch(s.files, [taskName]));

	staticTasks.push(taskName);
	staticWatches.push(watchName);
});
gulp.task('static', staticTasks);
gulp.task('watch-static', staticWatches);

// ---------- Shortcut tasks ----------
gulp.task('watch', [
	'watch-eslint',
	'watch-webpack',
	'watch-jade',
	'watch-sass',
	'watch-static',
]);
gulp.task('build', [
	'eslint',
	'webpack',
	'jade',
	'sass',
	'static',
]);
gulp.task('default', [
	'debug',
	'watch',
	'build',
]);
