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
            preinit: function() {
                return {$: $, jQuery: $, _: _};
            },
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
            exports: "_.nest",
            preinit: function() {
                return {_: _};  
            },
            init: function(_) {
                return _.nest;
            }
        }
    }
};

requirejs.config(config);

var template = '(function(global){\n\n'
    + 'define("<%= name %>", <%= JSON.stringify(deps || []) %>, function(<%= imports.join(", ") %>) { \n'
    + '    <% if(preinit){ %>\n'
    + '        var _window = (<%= preinit %>).call(this);\n'
    + '    (function(window){\n'
    + '    <% } %>\n'
    + '    // ---------------------------------------------\n'
    + '    // --------------- ORIGINAL CODE ---------------\n'
    + '    // ---------------------------------------------\n\n\n\n'
    + '    <%= code %>\n\n\n'
    + '    // ---------------------------------------------\n'
    + '    // --------------- AUTOGEN  CODE ---------------\n'
    + '    // ---------------------------------------------\n\n\n\n'
    + '    <% if(preinit){ %>\n'
    + '    }).call(_window, _window);\n'
    + '    <% if(exports){ %> global.<%= exports %> = _window.<%= exports %>; <% } %>\n'
    + '    <% } %>\n'
    + '        var ret, fn;\n'
    + '        <% if (init) { %>'
    + '        fn = <%= init.toString() %>;\n'
    + '        ret = fn.apply(global, arguments);\n'
    + '        <% } %>'
    + '        <% if (exports) { %>'
    + '        return ret || global.<%= exports %>;\n'
    + '        <% } else { %>'
    + '        return ret;\n'
    + '        <% } %>\n'
    + '    });\n'
    + '})(this);'
 
_.each(config.shim, function(shim, name) {
    var resolvedPath = requirejs.toUrl(name + ".js");
    if (!fs.existsSync(resolvedPath)) {
        console.log("EXIT");
        return;
    }
    
    var relativePath = path.relative(config.baseUrl, resolvedPath);
    var outPath = path.join(config.dir, path.basename(relativePath));
    var code = fs.readFileSync(resolvedPath);
    var shim = _.extend({name: name, code: code, deps: [], init: null, exports: null, imports: [], preinit: null}, config.shim[name]);
    
    var wrappedCode = _.template(template, shim);
    fs.writeFileSync(outPath, wrappedCode);
});