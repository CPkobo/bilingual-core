"use strict";
exports.__esModule = true;
var name = 'jpEraToAD';
var func = function (text) {
    return text.normalize('NFKD');
};
var plugin = {
    triger: 'onSetSouce',
    name: name,
    f: func
};
module.exports = plugin;
