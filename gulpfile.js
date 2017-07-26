'use strict';

var gulp = require('gulp');
var mocha = require('gulp-mocha');
var jshint = require('gulp-jshint');
var istanbul = require('gulp-istanbul');


gulp.task('test', function() {
	return gulp.src(['./tests/index.js'], {read: false})
		.pipe(mocha({
			reporter: 'spec',
			bail: true
		}));
});
