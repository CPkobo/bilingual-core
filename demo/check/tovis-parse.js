"use strict";
exports.__esModule = true;
var tovis_1 = require("../cli-funcs/tovis");
var fs_1 = require("fs");
var tovis = new tovis_1.Tovis();
// tovis.parseFromFile('./demo.tovis', 'tovis').then((successMessage) => {
tovis.parseFromFile('../demo.tovis', 'tovis').then(function (successMessage) {
    console.log(successMessage);
    var jsonStr = tovis.dumpToJson();
    var tovisStr = tovis.dump();
    fs_1.writeFileSync('./parsedemo.json', jsonStr);
    fs_1.writeFileSync('./parsedemo.tovis', tovisStr.join('\n'));
})["catch"](function (errMessage) {
    console.log('-----An Error has occurred-----');
    console.log(errMessage);
    console.log('-------------------------------');
});
