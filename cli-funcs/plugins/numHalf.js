"use strict";
exports.__esModule = true;
var name = 'numHalf';
var func = function (text) {
    return text.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function (s) {
        return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    });
};
var plugin = {
    triger: 'onSetSouce',
    name: name,
    f: func
};
module.exports = plugin;
