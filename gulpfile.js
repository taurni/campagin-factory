var gulp = require('gulp');
var fractal = require('./fractal.js');
var argv = require('yargs').argv;
var sq = require('gulp-sequence');

var destinations = {
    dev: 'public',
    dist: 'dist',
    export: 'export'
};

/*
Start a local Fractal instance.
*/
gulp.task('fractal:start', function() {
    var logger = fractal.cli.console;
    var server = fractal.web.server({
        sync: true
    });

    server.on('error', function(err) {
        return logger.error(err.message);
    });

    return server.start().then(function() {
        logger.success('Fractal server is now running at ' + server.url);
    });
});

/*
Build a static version of Fractal.
*/
gulp.task('fractal:build', function(cb) {
    var builder = fractal.web.builder();

    fractal.set('minify', true);

    builder.build().then(function() {
        cb();
    });
});

gulp.task('clean', function() {
    var del = require('del');

    return del(argv.dest);
});

/*
Developer mode
Generate assets, start Fractal & watch for changes in source.
*/
gulp.task('dev', function(cb) {
    argv.dest = destinations.dev;
    argv.env = 'dev';
    argv.concat = true;

    sq(['clean'], ['fractal:start'])(cb);
});

/*
Generate assets and build Fractal.
*/
gulp.task('default', function(cb) {
    argv.dest = destinations.dev;
    argv.env = 'dev';
    argv.concat = true;
    argv.minify = true;

    sq(['clean'],  ['fractal:build'])(cb);
});
