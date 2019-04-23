/* eslint-env es6, node */
/* eslint-disable no-console */
// Imports
var projectName = "rkas";
var gulp = require('gulp');
var fractal = require('./fractal.js');
var cottonmouth = require('@gotoandplay/cottonmouth');
var flatten = require('gulp-flatten');
var gulpif = require('gulp-if');
var sq = require('gulp-sequence');
var concat = require('gulp-concat');
var _ = require('lodash');
var argv = require('yargs').argv;
var path = require('path');
var fs = require('fs');
var sourcemaps = require('gulp-sourcemaps');
var cached = require('gulp-cached');
var remember = require('gulp-remember');
var sassGraph = require('sass-graph');

// Path definitions
var sourcePath = 'src';
var scssUtils = 'utils/styles/utils.scss';
var scssTheme = 'utils/styles/theme.scss';
var jsUtils = 'utils/js/utils.js';
var assetsSrc = sourcePath + '/**/assets/**/*';
var iconsSrc = sourcePath + '/components/icon/svg/*.svg';

var jsSrc = sourcePath + '/**/*.js';
var scssSrc = sourcePath + '/**/*.scss';
var docsPath = 'docs';


var autoPrefixerConfig = {
    browsers: ['last 2 versions', 'last 3 iOS versions']
};

var destinations = {
    dev: 'public',
    dist: 'dist',
    export: 'export'
};

var sassVars = [
    path.resolve(path.join('src', 'components', 'functions.scss')),
    path.resolve(path.join('src', 'components', 'variables.scss')),
    path.resolve(path.join('src', 'components', 'mixins.scss'))
];

// for export
if (argv.component) {
    argv.component = argv.component.split(',');
}

var cottonmouthConfig = {
    fractal: fractal,
    tag: argv.tag,
    components: argv.component,
    prependComponents: ['reset', 'typography','icon'],
    appendComponents: ['helper'],
    sortAssets: ['scss', 'js']
};

var cleanCSSOptions = {
    processImport: false
};

var dependencies = cottonmouth(cottonmouthConfig);
var styleGraph = sassGraph.parseDir(path.join(sourcePath));

var bowerdeps;

gulp.task('clean', function() {
    var del = require('del');

    return del(argv.dest);
});

/*
Lint source files.
*/
gulp.task('lint', ['lint:styles', 'lint:scripts']);

/*
Lint styles.
*/
gulp.task('lint:styles', function() {
    var stylelint = require('gulp-stylelint');

    return gulp.src(scssSrc)
    .pipe(cached('stylesLint'))
    .pipe(stylelint({
        reporters: [
            {
                formatter: 'string',
                console: true
            }
        ]
    }))
    .pipe(remember('stylesLint'));
});

function isFixed(file) {
    // Has ESLint fixed the file contents?
    return file.eslint != null && file.eslint.fixed;
}

/*
Lint scripts.
*/
gulp.task('lint:scripts', function() {
    return true;
    var eslint = require('gulp-eslint');

    var eslintConfig = {
        fix: true
    };

    return gulp.src(jsSrc)
    .pipe(eslint(eslintConfig))
    .pipe(eslint.format())
    .pipe(gulpif(isFixed, gulp.dest(sourcePath)));
});

/*
Build SVG icon sprite.
*/
gulp.task('icons', function() {
    var svgstore = require('gulp-svgstore');
    var svgmin = require('gulp-svgmin');
    var rename = require('gulp-rename');

    return gulp.src(iconsSrc)
    .pipe(svgmin(function(file) {
        var prefix = path.basename(file.relative, path.extname(file.relative));

        return {
            plugins: [{
                cleanupIDs: {
                    prefix: prefix + '-',
                    minify: true
                }
            },
            {
                removeTitle: true
            }]
        };
    }))
    .pipe(svgstore())
    .pipe(rename('icons.svg'))
    .pipe(gulp.dest(path.join(argv.dest, '/assets/svg')));
});


/*
Get a list of dependencies from bower.
*/
function getBowerDependencies() {
    var excludeFromConcat = ['jquery'];

    if (argv.env == 'dist') {
        excludeFromConcat = ['jquery', 'svg4everybody'];
    }

    return dependencies.then((dependencies) => {
        var returnable = {
            concat: [],
            separate: [],
            all: false
        };

        if (typeof argv.component !== 'undefined') {
            returnable.separate = ['jquery'];
            if (dependencies.bower && dependencies.bower.length) {
                for (var i = 0; i < dependencies.bower.length; i++) {
                    if (excludeFromConcat.indexOf(dependencies.bower[i]) == -1) {
                        returnable.concat.push(dependencies.bower[i]);
                    } else {
                        returnable.separate.push(dependencies.bower[i]);
                    }
                }
            }
        } else {
            returnable.all = true;
            returnable.separate = excludeFromConcat;
        }

        return returnable;
    });
}

/*
Copy all necessary assets to destination folder.
*/
gulp.task('assets', function() {
    return gulp.src(sourcePath + '/**/assets/**/*')
    .pipe(flatten({
        includeParents: -1
    }))
    .pipe(gulp.dest(path.join(argv.dest, '/assets')));
});

/*
Compile component styles.
*/
gulp.task('styles', function() {
    var sass = require('gulp-sass');
    var postcss = require('gulp-postcss');
    var autoprefixer = require('autoprefixer');
    var cleanCSS = require('gulp-clean-css');
    var header = require('gulp-header');

    return dependencies.then((dependencies) => {
        var paths = dependencies.paths.scss ? dependencies.paths.scss : scssSrc;

        var prepend = '';

        for (var i = 0; i < sassVars.length; i++) {
            prepend += fs.readFileSync(sassVars[i]);
        }

        var concatFileName = projectName+'.css';

        if (argv.minify) {
            concatFileName = projectName+'.min.css';
        }

        return gulp.src(paths)
        .pipe(sourcemaps.init())
        .pipe(cached('styles'))
        .pipe(header(prepend))
        .pipe(sass({
            outputStyle: 'expanded'
        }).on('error', sass.logError))
        .pipe(postcss([autoprefixer(autoPrefixerConfig)]))
        .pipe(remember('styles'))
        .pipe(gulpif((argv.concat), concat(concatFileName)))
        .pipe(gulpif((argv.minify), cleanCSS(cleanCSSOptions)))
        .pipe(sourcemaps.write(path.join('.')))
        .pipe(gulp.dest(path.join(argv.dest, '/assets/css')));
    });
});

gulp.task('scripts', ['scripts:components', 'scripts:bower']);

// Concat all components javascript
gulp.task('scripts:components', function() {
    var gulpImports = require('gulp-imports');

    return dependencies.then((dependencies) => {
        var paths = dependencies.paths.js ? dependencies.paths.js : jsSrc;

        return gulp.src(paths)
        .pipe(sourcemaps.init())
        .pipe(gulpImports())
        .pipe(gulpif(((argv.env == 'export' && argv.concat) || argv.env != 'export'), concat(projectName+'.js')))
        .pipe(sourcemaps.write(path.join('.')))
        .pipe(gulp.dest(path.join(argv.dest, '/assets/js')));
    });
});

gulp.task('scripts:bower', function(cb) {
    bowerdeps = getBowerDependencies();
    bowerdeps.then(() => {
        sq(['scripts:bower:concat', 'scripts:bower:separate'])(cb);
    });
});

gulp.task('scripts:bower:concat', function() {
    var mainBowerFiles = require('main-bower-files');

    return bowerdeps.then((bowerdeps) => {
        var concatArray = [];

        if (bowerdeps.all) {
            concatArray.push(path.join('**', '*.js'));
        }

        for (var i = 0; i < bowerdeps.separate.length; i++) {
            concatArray.push(path.join('!**', bowerdeps.separate[i], '**', '*.js'));
        }

        if (bowerdeps.concat.length > 0) {
            for (var j = 0; j < bowerdeps.concat.length; j++) {
                concatArray.push(path.join('**', bowerdeps.concat[j], '**', '*.js'));
            }
        }

        return gulp.src(mainBowerFiles(concatArray))
        .pipe(sourcemaps.init())
        .pipe(gulpif((argv.concat), concat('bower-plugins.js')))
        .pipe(sourcemaps.write(path.join('.')))
        .pipe(gulp.dest(path.join(argv.dest, '/assets/js')));
    });
});

gulp.task('scripts:bower:separate', function() {
    var mainBowerFiles = require('main-bower-files');

    return bowerdeps.then((bowerdeps) => {
        var separateArray = [];

        separateArray.push(path.join('!**', '*.js'));

        for (var i = 0; i < bowerdeps.separate.length; i++) {
            separateArray.push(path.join('**', bowerdeps.separate[i], '**', '*.js'));
        }

        return gulp.src(mainBowerFiles(separateArray))
        .pipe(gulp.dest(path.join(argv.dest, '/assets/js')));
    });
});

/*
Generate utility assets.
*/
gulp.task('utils', ['utils:styles', 'utils:scripts', 'theme:styles']);

/*
Copy styleguide utility styles to destination folder.
*/
gulp.task('utils:styles', function() {
    var sass = require('gulp-sass');
    var postcss = require('gulp-postcss');
    var autoprefixer = require('autoprefixer');
    var rename = require('gulp-rename');
    var cleanCSS = require('gulp-clean-css');

    return gulp.src(scssUtils)
    .pipe(sourcemaps.init())
    .pipe(sass({
        outputStyle: 'expanded'
    }).on('error', sass.logError))
    .pipe(postcss([autoprefixer(autoPrefixerConfig)]))
    .pipe(gulpif((argv.minify), rename('utils.min.css')))
    .pipe(gulpif((argv.minify), cleanCSS(cleanCSSOptions)))
    .pipe(sourcemaps.write(path.join('.')))
    .pipe(gulp.dest(path.join(argv.dest, '/assets/css')));
});

/*
Copy styleguide utility styles to destination folder.
*/
gulp.task('theme:styles', function() {
    var sass = require('gulp-sass');
    var postcss = require('gulp-postcss');
    var autoprefixer = require('autoprefixer');
    var rename = require('gulp-rename');
    var cleanCSS = require('gulp-clean-css');

    return gulp.src(scssTheme)
        .pipe(sourcemaps.init())
        .pipe(sass({
            outputStyle: 'expanded'
        }).on('error', sass.logError))
        .pipe(postcss([autoprefixer(autoPrefixerConfig)]))
        .pipe(gulpif((argv.minify), rename('theme.min.css')))
        .pipe(gulpif((argv.minify), cleanCSS(cleanCSSOptions)))
        .pipe(sourcemaps.write(path.join('.')))
        .pipe(gulp.dest(path.join(argv.dest, '/assets/css')));
});

/*
Copy styleguide utility scripts to destination folder.
*/
gulp.task('utils:scripts', function() {
    return gulp.src(jsUtils)
    .pipe(gulp.dest(path.join(argv.dest, '/assets/js')));
});

/*
Start a local Fractal instance.
*/
gulp.task('fractal:start', function() {
    const logger = fractal.cli.console;
    const server = fractal.web.server({
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
    const builder = fractal.web.builder();

    fractal.set('minify', true);

    builder.build().then(function() {
        cb();
    });
});

/*
Developer mode
Generate assets, start Fractal & watch for changes in source.
*/
gulp.task('dev', function(cb) {
    argv.dest = destinations.dev;
    argv.env = 'dev';
    argv.concat = true;

    dependencies.then(() => {
        var styleWatcher = gulp.watch(scssSrc, ['lint:styles', 'styles']);

        gulp.watch(iconsSrc, ['icons']); //switch off
        gulp.watch(assetsSrc, ['assets']);
        gulp.watch(jsSrc, ['lint:scripts', 'scripts:components']);

        /**
         * If global variable files have changed, delete style cache and recompile everything.
         */
        styleWatcher.on('change', function(event) {
            if (sassVars.includes(event.path)) {
                delete cached.caches['styles'];
            } else if (styleGraph.index[event.path] && styleGraph.index[event.path].importedBy.length) {
                var importedBy = styleGraph.index[event.path].importedBy;

                for (var i = 0; i < importedBy.length; i++) {
                    delete cached.caches['styles'][importedBy[i]];
                }
            }
        });

        sq(['clean'], ['lint', 'styles', 'scripts', 'icons', 'assets', 'utils'], ['fractal:start'])(cb);
    });
});

/*
Generate assets and build Fractal.
*/
gulp.task('default', function(cb) {
    argv.dest = destinations.dev;
    argv.env = 'dev';
    argv.concat = true;
    argv.minify = true;

    dependencies.then(() => {
        sq(['clean'], ['lint', 'styles','scripts', 'icons', 'assets', 'utils'], ['fractal:build'])(cb);
    });
});



/* DISTRIBUTION TASKS */
gulp.task('dist', function(callback) {
    argv.env = 'dist';
    argv.dest = destinations.dist;
    argv.concat = true;
    argv.minify = true;

    dependencies.then(() => {
        sq(['clean'], ['styles', 'scripts', 'assets', 'icons', 'utils', 'dist:templates', 'dist:context'])(callback);
    });
});

gulp.task('dist:templates', function () {
    var gulpRegexp = require('gulp-regexp-sourcemaps');

    return gulp.src('src/**/*.twig')
        .pipe(gulpRegexp(
            /["']@([\w-]+)["']/g,
            '"@fractal_component/$1"'
        ))
        .pipe(gulpRegexp(
            /\|\s?path/g,
            ''
        ))
        .pipe(flatten({ includeParents: -1}))
        .pipe(gulp.dest('dist/src'));
});

gulp.task('dist:context', function () {

    return gulp.src('src/**/*.config.yaml')
        .pipe(flatten({ includeParents: -1}))
        .pipe(gulp.dest('dist/src'));
});

gulp.task('dist:pathmap', function (cb) {
    fractal.cli.exec('pathmap');
    cb();
});
