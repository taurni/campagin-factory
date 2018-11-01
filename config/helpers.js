/* eslint-env node */

var helpers =  {
    default: function(param, defaultValue) {
        // helper for adding param with default value
        if (typeof param === 'undefined') {
            return defaultValue;
        } else {
            return param;
        }
    },
    $: function(param) {
        // helper for handeling modifiers parameter for handelbars and SC5
        if (typeof param === 'undefined') {
            return '{$modifiers}';
        } else {
            return param;
        }
    },
    concat: function(x, y) {
        x = x ? x : '';
        y = y ? y : '';

        return x + '' + y;
    },
    eq: function(A, B) {
        if (A === B) {
            return true;
        }

        return false;
    },
    attr: function() {
        var ret = '';
        var prefix = 'attr-';
        var p = this;

        for (var key in p) {
            if (p.hasOwnProperty(key) && key.startsWith(prefix) && p[key]) {
                ret += key.replace(prefix, '');
                if (typeof p[key] === 'string') {
                    ret += '="' + p[key].replace(/"/g, '&quot;') + '"';
                }
                ret += ' ';
                delete p[key];
            }
        }

        return ret;
    },

    /* Comma Separated Value */
    csv: function(param) {
        if (param === undefined) return [];

        return param.split(/\s?,\s?/);
    },

    /**
     * Parse JSON string to JSON.
     * @param {string} data JSON string
     * @returns JSON
     */
    json: function(data) {
        return JSON.parse(data);
    },

    /**
     * A basic loop helper.
     */
    times: function(n, block) {
        var accum = '';

        for (var i = 1; i < (n + 1); ++i) {
            accum += block.fn(i);
        }

        return accum;
    },

    cond: function(v1, operator, v2){
        switch (operator) {
            case '<':
                return (v1 < v2);
            case '>':
                return (v1 > v2);
            case '<=':
                return (v1 <= v2);
            case '>=':
                return (v1 >= v2);
            case '==':
                return (v1 == v2);
            case '%':
                return (v1 % v2)
        }
    }
};

module.exports = helpers;
