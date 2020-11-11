"use strict";
exports.__esModule = true;
var MyPlugins = /** @class */ (function () {
    function MyPlugins() {
        this.funcs = [];
    }
    MyPlugins.prototype.registerFunction = function (scriptPath) {
        if (typeof (scriptPath) === 'string') {
            var myFunc = require(scriptPath);
            this.funcs.push(myFunc);
        }
        else {
            for (var _i = 0, scriptPath_1 = scriptPath; _i < scriptPath_1.length; _i++) {
                var path = scriptPath_1[_i];
                var myFunc = require(path);
                this.funcs.push(myFunc);
            }
        }
    };
    MyPlugins.prototype.registerObjFunction = function (scriptPath) {
        var myObjFunc = require(scriptPath);
        this.funcs.push(myObjFunc.f);
    };
    MyPlugins.prototype.execFuncs = function () {
        if (this.funcs.length === 0) {
            console.log('no functions');
        }
        else {
            for (var _i = 0, _a = this.funcs; _i < _a.length; _i++) {
                var f = _a[_i];
                console.log(f('text'));
            }
        }
    };
    return MyPlugins;
}());
var pl = new MyPlugins();
pl.registerFunction('./firstPL.js');
pl.registerFunction('./secondPL.js');
pl.registerFunction(['./firstPL.js', './secondPL.js']);
pl.registerObjFunction('./thirdPL.js');
pl.execFuncs();
