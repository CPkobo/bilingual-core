"use strict";
exports.__esModule = true;
var name = 'normalize';
var func = function (text) {
    return text.normalize('NFKD');
};
var plugin = {
    triger: ['onSetSouce', 'onSetMT'],
    name: name,
    f: func
};
module.exports = plugin;
