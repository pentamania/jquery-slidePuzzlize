/*
* gulpfile.js
*/

var gulp = require('gulp');
var header = require('gulp-header');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var pump = require('pump');

var pkg = require('./package.json');

var banner = [
  "/* ",
  " * <%= pkg.name %> <%= pkg.version %>",
  " * MIT Licensed",
  " * ",
  " * Copyright (C) <%= pkg.author %>, <%= pkg.homepage %>",
  " */",
  "",
  "",
].join('\n');

var opt = {
  src: './src/jquery.slidePuzzlize.js',
  dest: './',
};

gulp.task('copy', function() {
  return gulp
    .src(opt.src)
    .pipe(header(banner, {
      pkg: pkg,
    }))
    .pipe(gulp.dest(opt.dest))
    ;
});

gulp.task('uglify', function(cb) {
  pump([
      gulp.src(opt.src),
      uglify(),
      header(banner, {
        pkg: pkg,
      }),
      rename({
        extname: '.min.js'
      }),
      gulp.dest(opt.dest)
    ],
    cb
  );
});

// gulp.task('uglify', function() {
//   return gulp.src(opt.src)
//     .pipe(uglify())
//     .pipe(header(banner, {
//       pkg: pkg,
//     }))
//     .pipe(rename({
//       extname: '.min.js'
//     }))
//     .pipe(gulp.dest(opt.dest))
//     .on('end', function() {
//       console.log('finish');
//     });
// });

gulp.task('default', ['copy', 'uglify']);