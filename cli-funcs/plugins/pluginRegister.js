"use strict";
exports.__esModule = true;
exports.MyPlugins = void 0;
var fs_1 = require("fs");
var MyPlugins = /** @class */ (function () {
    function MyPlugins() {
        this.funcs = [];
    }
    MyPlugins.prototype.registerFunction = function (scriptPath) {
        var myScript = fs_1.readFileSync(scriptPath).toString();
        console.log(myScript)
        var myFunc = eval(myScript);
        console.log(myFunc);
        myFunc('hoge');
        this.funcs.push(myFunc);
    };
    MyPlugins.prototype.execFuncs = function () {
        if (this.funcs.length === 0) {
            console.log('no functions');
        }
        else {
            for (var _i = 0, _a = this.funcs; _i < _a.length; _i++) {
                var f = _a[_i];
                f('text');
            }
        }
    };
    return MyPlugins;
}());
exports.MyPlugins = MyPlugins;
var pl = new MyPlugins();
pl.registerFunction('./firstPL.js');
pl.execFuncs();
