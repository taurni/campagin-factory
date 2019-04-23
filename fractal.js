/* eslint-env es6, node */
'use strict';

/* Create a new Fractal instance and export it for use elsewhereRequire the Fractal module */
const fractal = module.exports = require('@frctl/fractal').create();
const mandelbrot = require('@frctl/mandelbrot');

/*
 * Project-related metadata
 */
fractal.set('project.title', 'Tallink Template Factory');

/*
 * Configuring components
 */
fractal.components.set('path', __dirname + '/src');
fractal.components.set('default.preview', '@preview');
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
fractal.components.set('default.context', {
    theme: {
        bgColor: "#f5f8f7",
        textColor: "#004152",
        fontSize: "14px"
    }

});

fractal.components.set('default.collated', true);

/*
 * Configuring documentation pages.
 */
fractal.docs.set('path', __dirname + '/docs');


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
