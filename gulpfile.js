const gulp = require('gulp')
const babelify = require('babelify')
const browserify = require('browserify')
const nodemon = require('gulp-nodemon')
// for converting browserify output into a format gulp can use
const source = require('vinyl-source-stream')

// run transforms on client-side files
// TODO: break out into multiple tasks (js, css) that client task runs
gulp.task('client', () => {
    browserify('client/src/js/index.js')
        .transform('babelify', { presets: ['env'] })
        .bundle()
        .pipe(source('bundle.js'))
        .pipe(gulp.dest('client/dist/js'))
})

// i am doing this in a really stupid way
gulp.task('watch', ['client'], () => {
    return nodemon({
        script: './server/app.js',
        watch: ['./client/src', './server'],
        ext: '.js',
        tasks: ['client']
    })
})

gulp.task('start', ['watch'])


