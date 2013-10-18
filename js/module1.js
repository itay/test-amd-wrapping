define(function(require, exports, module) {    
    var _ = require("underscore");
    var Backbone = require("backbone");
    var $ = require("jquery");
    var nester = require("underscore.nest");
    
    return {
        nester: nester.version,
        jquery: $.fn.jquery,
        underscore: _.VERSION,
        backbone: Backbone.VERSION
    };
});