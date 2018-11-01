/* eslint-env es6, node */
'use strict';

/* Create a new Fractal instance and export it for use elsewhereRequire the Fractal module */
const fractal = module.exports = require('@frctl/fractal').create();
const mandelbrot = require('@frctl/mandelbrot');
// const hbs = require('@frctl/handlebars');
// const localHelpers = require('./config/helpers.js');
/*const hbs = require('@frctl/handlebars')({
    helpers: localHelpers
    /!* other configuration options here *!/
});*/

/*
 * Project-related metadata
 */
fractal.set('project.title', 'Tallink Template Factory');

/*
 * Configuring components
 */
fractal.components.set('path', __dirname + '/src');
// fractal.components.set('default.preview', '@preview-container');
fractal.components.set('default.preview', '@preview');
// fractal.components.set('default.status', 'wip');
const twigAdapter = require('@frctl/twig')({
    functions:
        {
            attrs: function (data) {
                /**
                 * Twig helper function to generate custom attributes from data object.
                 * Sets:
                 * objectKey as attribute name
                 * objectValue as attribute value
                 *
                 * Object value can by either String or Array of Strings.
                 * In case of array of strings, all values from array are concatenated
                 * into one string separated by space.
                 */
                var attrs = "";

                for (var key in data) {
                    if (data.hasOwnProperty(key) && key !== "_keys") {
                        var val = data[key];

                        if(Array.isArray(val)){
                            val = val.toString().replace(","," ");
                        }
                        attrs += key + '="' + val +'" ';
                    }
                }
                return attrs;
            }
        }
});

fractal.components.engine(twigAdapter);
fractal.components.set('ext', '.twig');

// Global context data that will be made available to all components when rendering previews,
fractal.components.set('default.context', {});

fractal.components.set('default.collated', true);

// fractal.components.set('statuses', {
//     prototype: {
//         key: 'prototype',
//         label: 'Prototype',
//         description: 'Do not implement.'
//     },
//     wip: {
//         key: 'wip',
//         label: 'WIP',
//         description: 'Work in progress. Implement with caution.'
//     },
//     ready: {
//         key: 'ready',
//         label: 'Ready',
//         description: 'Ready to implement.'
//     }
// });

/*
 * Configuring documentation pages.
 */
fractal.docs.set('path', __dirname + '/docs');
// fractal.docs.set('ext', '.hbs');
// fractal.docs.engine(hbs);


/*
 * Configuring the web UI
 */
// static assets path.
fractal.web.set('static.path', __dirname + '/public');
// static build path
fractal.web.set('builder.dest', __dirname + '/build');

/*
 * Fractal Web Theme settings
 */
const projectTheme = mandelbrot(
    {
        "styles": [
            "default",
            "/assets/css/theme.css",
            "/assets/css/theme.min.css"
        ]
    }
);

fractal.web.theme(projectTheme);


/*
 * Handle => filesystem path mapping export.
 * https://clearleft.com/posts/the-living-component-library
 */

function exportPaths() {
    const path = require('path');
    const fs = require('fs');
    const map = {};
    for (let item of fractal.components.flatten()) {
        map[`@${item.handle}/${item.handle}.twig`] = path.relative(process.cwd(), item.viewPath);
    }
    fs.writeFileSync('dist/components-map.json', JSON.stringify(map, null, 2), 'utf8');
}

// fractal.components.on('updated', function(){
//     exportPaths();
// });

fractal.cli.command('pathmap', function(opts, done){
    exportPaths();
    done();
});
