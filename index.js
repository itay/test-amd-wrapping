var fs = require("fs");
var path = require("path");
var requirejs = require("requirejs");
var _ = require("underscore");


var config = {
    baseUrl: './',
    dir: "./lib-wrapped",
    paths: {
        "jquery": "lib/jquery",
        "backbone": "lib/backbone",
        "underscore": "lib/underscore",
        "underscore.nest": "lib/underscore.nest"
    },
    shim: {
        "jquery": {
            exports: "$",
            init: function() {
                return jQuery.noConflict();
            }
        },
        "backbone": {
            deps: ["jquery", "underscore"],
            imports: ["$", "_"],
            exports: 'Backbone',
            sandbox: '{$: $, jQuery: $, _: _}', // Create a sandbox to simulate the global/window scope
            init: function($, _) {
                if(this.Backbone.hasOwnProperty('setDomLibrary')) {
                    this.Backbone.setDomLibrary($);
                }
                else {
                    this.Backbone.$ = $;
                }
                return this.Backbone.noConflict();
            }
        },
        "underscore": {
            exports: "_",
            init: function() {
                return _.noConflict();
            }
        },
        "underscore.nest": {
            deps: ["underscore"],
            imports: ["_"],
            sandbox: '{ _: _ }',
            exports: "_.nest"
        }
    }
};

requirejs.config(config);

var template = ''
    + 'define("<%= name %>", <%= JSON.stringify(deps || []) %>, function(<%= imports.join(", ") %>) { \n'
    + '<% if (preinit) { %>'
    + '    <%= preinit %>\n'
    + '<% } %>'
    + '<% if (sandbox) { %>'
    + '    var __sandbox = <%= sandbox %>;\n'
    + '    (function(window){\n'
    + '<% } %>'
    + '    // ---------------------------------------------\n'
    + '    // --------------- ORIGINAL CODE ---------------\n'
    + '    // ---------------------------------------------\n\n\n\n'
    + '    <%= code %>\n\n\n'
    + '    // ---------------------------------------------\n'
    + '    // --------------- AUTOGEN  CODE ---------------\n'
    + '    // ---------------------------------------------\n\n\n\n'
    + '<% if (sandbox) { %>'
    + '    }).call(__sandbox, __sandbox);\n\n'
    + '<% } %>'
    + '<% if (init) { %>'
    + '    var fn = <%= init.toString() %>;\n'
    + '    return fn.apply(<%= sandbox ? "__sandbox" : "this" %>, arguments);\n'
    + '<% } else { %>'
    + '<% if (exports) { %>'
    + '    return <%= sandbox ? "__sandbox." + exports : exports %>;\n'
    + '<% } %>'
    + '<% } %>'
    + '});'
 
_.each(config.shim, function(shim, name) {
    var resolvedPath = requirejs.toUrl(name + ".js");
    if (!fs.existsSync(resolvedPath)) {
        console.log("EXIT");
        return;
    }
    
    var relativePath = path.relative(config.baseUrl, resolvedPath);
    var outPath = path.join(config.dir, path.basename(relativePath));
    var code = fs.readFileSync(resolvedPath);
    var shim = _.extend({name: name, code: code, deps: [], init: null, exports: null, imports: [], preinit: null, sandbox: null}, config.shim[name]);
    
    var wrappedCode = _.template(template, shim);
    fs.writeFileSync(outPath, wrappedCode);
});