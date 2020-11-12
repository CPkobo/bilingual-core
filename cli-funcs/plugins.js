"use strict";
exports.__esModule = true;
exports.MyPlugins = void 0;
var fs_1 = require("fs");
var MyPlugins = /** @class */ (function () {
    function MyPlugins() {
        this.onSetSouce = [];
        this.onSetMT = [];
        this.onQA = [];
    }
    MyPlugins.prototype.register = function (scriptPath) {
        var paths = typeof (scriptPath) === 'string' ? [scriptPath] : scriptPath;
        for (var _i = 0, paths_1 = paths; _i < paths_1.length; _i++) {
            var path = paths_1[_i];
            try {
                fs_1.statSync(path);
            }
            catch (e) {
                console.log(path + " does not exists...");
                continue;
            }
            var myPluginEx = require(path);
            var trigers = typeof (myPluginEx.triger) === 'string' ? [myPluginEx.triger] : myPluginEx.triger;
            for (var _a = 0, trigers_1 = trigers; _a < trigers_1.length; _a++) {
                var triger = trigers_1[_a];
                var myPlugin = {
                    name: myPluginEx.name,
                    f: myPluginEx.f
                };
                switch (triger) {
                    case 'onSetSouce':
                        this.onSetSouce.push(myPlugin);
                        break;
                    case 'onSetMT':
                        this.onSetMT.push(myPlugin);
                    case 'onQA':
                        this.onQA.push(myPlugin);
                    default:
                        break;
                }
            }
        }
    };
    MyPlugins.prototype.execFuncs = function (triger, text) {
        var processed = text;
        var toExecutes = triger === 'onSetSouce' ? this.onSetSouce
            : triger === 'onSetMT' ? this.onSetMT : this.onQA;
        for (var _i = 0, toExecutes_1 = toExecutes; _i < toExecutes_1.length; _i++) {
            var toExecute = toExecutes_1[_i];
            processed = toExecute.f(processed);
        }
        return processed;
    };
    return MyPlugins;
}());
exports.MyPlugins = MyPlugins;
// const pl = new MyPlugins()
// pl.register('./plugins/normalize.js')
// console.log(pl.execFuncs('onSetSouce', '（ａｉｕｅｏとaiueo）'))
