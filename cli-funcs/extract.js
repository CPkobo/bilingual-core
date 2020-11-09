"use strict";
/* tslint:disable:max-line-length */
/* tslint:disable:max-classes-per-file */
/* tslint:disable:no-shadowed-variable */
/* tslint:disable:prefer-for-of */
exports.__esModule = true;
exports.CatovisContext = void 0;
// cliフォルダでtscするときはrequireを使う
// import JSZip from 'jszip'
var JSZip = require('jszip');
var option_1 = require("./option");
var stats_1 = require("./stats");
var CatovisContext = /** @class */ (function () {
    function CatovisContext() {
        this.src = null;
        this.tgt = null;
    }
    CatovisContext.prototype.readContent = function (src, tgt) {
        this.src = src;
        if (tgt !== undefined) {
            this.tgt = tgt;
        }
    };
    CatovisContext.prototype.readFromJSON = function (target, jsonStr) {
        switch (target) {
            case 'src':
                this.src = JSON.parse(jsonStr);
                this.tgt = null;
                break;
            case 'tgt':
                this.src = null;
                this.tgt = JSON.parse(jsonStr);
                break;
            case 'both':
                var data = JSON.parse(jsonStr);
                this.src = data.src;
                this.tgt = data.tgt;
            default:
                break;
        }
    };
    CatovisContext.prototype.changeActives = function (target, index, actives) {
        var toChange = target === 'src' ? this.src : this.tgt;
        if (toChange === null) {
            return;
        }
        else if (actives.length !== toChange[index].exts.length) {
            return;
        }
        for (var i = 0; i < actives.length; i++) {
            toChange[index].exts[i].isActive = actives[i];
        }
    };
    CatovisContext.prototype.moveFile = function (target, fx, move) {
        var toChange = target === 'src' ? this.src : this.tgt;
        if (toChange === null) {
            return;
        }
        var tempCon = toChange.splice(fx, 1)[0];
        toChange.splice(fx + move, 0, tempCon);
    };
    CatovisContext.prototype.getRawContent = function (target) {
        if (target === 'src') {
            return this.src;
        }
        else if (target === 'tgt') {
            return this.tgt;
        }
        else {
            return null;
        }
    };
    CatovisContext.prototype.getSingleText = function (from, opq) {
        var _this = this;
        var que = opq !== undefined ? opq : {};
        var opt = new option_1.ReadingOption(que);
        return new Promise(function (resolve, reject) {
            var target = [];
            if (from === 'src') {
                if (_this.src === null) {
                    reject('No Source files contained');
                }
                else {
                    target = _this.src;
                }
            }
            if (from === 'tgt') {
                if (_this.tgt === null) {
                    reject('No Target files contained');
                }
                else {
                    target = _this.tgt;
                }
            }
            var result = [];
            for (var _i = 0, target_1 = target; _i < target_1.length; _i++) {
                var file = target_1[_i];
                if (opt.withSeparator) {
                    result.push(file.name);
                }
                for (var _a = 0, _b = file.exts; _a < _b.length; _a++) {
                    var text = _b[_a];
                    if (!opt.excelReadHidden && !text.isActive) {
                        continue;
                    }
                    if (opt.withSeparator) {
                        var mark = '';
                        switch (text.type) {
                            case 'Word-Paragraph':
                                mark = '_@λ_ PARAGRAPH _λ@_';
                                break;
                            case 'Word-Table':
                                mark = '_@λ_ TABLE _λ@_';
                                break;
                            case 'Excel-Sheet':
                                mark = "_@\u03BB_ SHEET" + text.position + " _\u03BB@_";
                                break;
                            case 'Excel-Shape':
                                mark = "_@\u03BB_ SHEET" + text.position + " shape _\u03BB@_";
                                break;
                            case 'PPT-Slide':
                                mark = "_@\u03BB_ SLIDE" + text.position + " _\u03BB@_";
                                break;
                            case 'PPT-Diagram':
                                mark = "_@\u03BB_ SLIDE" + text.position + " diagram _\u03BB@_";
                                break;
                            case 'PPT-Note':
                                mark = "_@\u03BB_ SLIDE" + text.position + " note _\u03BB@_";
                                break;
                            default:
                                break;
                        }
                        result.push(mark);
                    }
                    result.push.apply(result, text.value);
                }
            }
            resolve(result);
        });
    };
    CatovisContext.prototype.simpleCalcOneFile = function (unit, fx, opq) {
        var que = opq !== undefined ? opq : {};
        var opt = new option_1.ReadingOption(que);
        if (this.src === null) {
            return [];
        }
        else {
            var sums = [];
            var spaces_1 = new RegExp('\\s+', 'g');
            var marks_1 = new RegExp('(\\,|\\.|:|;|\\!|\\?|\\s)+', 'g');
            var _loop_1 = function (text) {
                if (!opt.excelReadHidden && !text.isActive) {
                    sums.push(0);
                    return "continue";
                }
                var sum = 0;
                text.value.map(function (val) {
                    if (unit === 'chara') {
                        sum += val.replace(spaces_1, '').length;
                    }
                    else if (unit === 'word') {
                        sum += (val + ".").replace(marks_1, ' ').split(' ').length - 1;
                    }
                });
                sums.push(sum);
            };
            for (var _i = 0, _a = this.src[fx].exts; _i < _a.length; _i++) {
                var text = _a[_i];
                _loop_1(text);
            }
            return sums;
        }
    };
    CatovisContext.prototype.simpleCalc = function (unit, opq) {
        var que = opq !== undefined ? opq : {};
        var opt = new option_1.ReadingOption(que);
        var totalSum = 0;
        var unitStr = unit === 'chara' ? '文字数' : '単語数';
        var result = ["\u30D5\u30A1\u30A4\u30EB\u540D\t" + unitStr, ''];
        var spaces = new RegExp('\\s+', 'g');
        var marks = new RegExp('(\\,|\\.|:|;|\\!|\\?|\\s)+', 'g');
        if (this.src === null) {
            return [];
        }
        else {
            var _loop_2 = function (con) {
                var sum = 0;
                for (var _i = 0, _a = con.exts; _i < _a.length; _i++) {
                    var text = _a[_i];
                    if (!opt.excelReadHidden && !text.isActive) {
                        continue;
                    }
                    text.value.map(function (val) {
                        if (unit === 'chara') {
                            sum += val.replace(spaces, '').length;
                        }
                        else if (unit === 'word') {
                            sum += (val + ".").replace(marks, ' ').split(' ').length - 1;
                        }
                    });
                }
                totalSum += sum;
                result.push(con.name + "\t" + sum);
            };
            for (var _i = 0, _a = this.src; _i < _a.length; _i++) {
                var con = _a[_i];
                _loop_2(con);
            }
            result[1] = "\u7DCF\u8A08\t" + totalSum;
            return result;
        }
    };
    CatovisContext.prototype.getAlignedText = function (opq) {
        var _this = this;
        var que = opq !== undefined ? opq : {};
        var opt = new option_1.ReadingOption(que);
        return new Promise(function (resolve, reject) {
            if (_this.src === null) {
                reject('No Source files contained');
            }
            else if (_this.tgt === null) {
                reject('No Target files contained');
            }
            else {
                var len = _this.src.length;
                var aligned = [];
                for (var i = 0; i < len; i++) {
                    var sf = _this.src[i];
                    var tf = _this.tgt[i];
                    var inFile = [];
                    if (opt.withSeparator) {
                        inFile.push("_@@_ " + sf.name + "\t_@@_ " + tf.name);
                    }
                    var type = sf.format;
                    switch (type) {
                        case 'docx': {
                            var spfs = [];
                            var stfs = [];
                            for (var _i = 0, _a = sf.exts; _i < _a.length; _i++) {
                                var et = _a[_i];
                                if (!opt.excelReadHidden && !et.isActive) {
                                    continue;
                                }
                                if (et.type === 'Word-Paragraph') {
                                    spfs.push(et);
                                }
                                else if (et.type === 'Word-Table') {
                                    stfs.push(et);
                                }
                            }
                            var tpfs = [];
                            var ttfs = [];
                            for (var _b = 0, _c = tf.exts; _b < _c.length; _b++) {
                                var et = _c[_b];
                                if (!opt.excelReadHidden && !et.isActive) {
                                    continue;
                                }
                                if (et.type === 'Word-Paragraph') {
                                    tpfs.push(et);
                                }
                                else if (et.type === 'Word-Table') {
                                    ttfs.push(et);
                                }
                            }
                            var spfNum = spfs.length;
                            var tpfNum = tpfs.length;
                            var plarger = spfNum >= tpfNum ? spfNum : tpfNum;
                            for (var j = 0; j < plarger; j++) {
                                var sv = spfs[j] !== undefined ? spfs[j].value.slice() : [''];
                                var tv = tpfs[j] !== undefined ? tpfs[j].value.slice() : [''];
                                inFile.push.apply(inFile, _this.segPairing(sv, tv, 'PARAGRAPH', opt.withSeparator));
                            }
                            var stfNum = stfs.length;
                            var ttfNum = ttfs.length;
                            var tlarger = stfNum >= ttfNum ? stfNum : ttfNum;
                            for (var k = 0; k < tlarger; k++) {
                                var sv = stfs[k] !== undefined ? stfs[k].value.slice() : [''];
                                var tv = ttfs[k] !== undefined ? ttfs[k].value.slice() : [''];
                                inFile.push.apply(inFile, _this.segPairing(sv, tv, 'TABLE', opt.withSeparator));
                            }
                            inFile.push('_@@_ EOF\t_@@_ EOF');
                            aligned.push.apply(aligned, inFile);
                            break;
                        }
                        case 'xlsx': {
                            var sfNum = sf.exts.length;
                            var tfNum = tf.exts.length;
                            var larger = sfNum >= tfNum ? sfNum : tfNum;
                            var k = 0;
                            for (var j = 0; j <= larger - 1; j++) {
                                k++;
                                var sv = sf.exts[j] !== undefined ? sf.exts[j].value.slice() : [''];
                                var tv = tf.exts[j] !== undefined ? tf.exts[j].value.slice() : [''];
                                inFile.push.apply(inFile, _this.segPairing(sv, tv, "SHEET" + k, opt.withSeparator));
                                if (sf.exts[j + 1] !== undefined && tf.exts[j + 1] !== undefined) {
                                    if (sf.exts[j + 1].type === 'Excel-Shape' || tf.exts[j + 1].type === 'Excel-Shape') {
                                        var sv_1 = sf.exts[j + 1].type === 'Excel-Shape' ? sf.exts[j + 1].value.slice() : [''];
                                        var tv_1 = tf.exts[j + 1].type === 'Excel-Shape' ? tf.exts[j + 1].value.slice() : [''];
                                        inFile.push.apply(inFile, _this.segPairing(sv_1, tv_1, "SHEET" + k + "-shape", opt.withSeparator));
                                        j++;
                                    }
                                }
                            }
                            inFile.push('_@@_ EOF\t_@@_ EOF');
                            aligned.push.apply(aligned, inFile);
                            break;
                        }
                        case 'pptx': {
                            var sfNum = sf.exts.length;
                            var tfNum = tf.exts.length;
                            var larger = sfNum >= tfNum ? sfNum : tfNum;
                            var k = 0;
                            for (var j = 0; j <= larger - 1; j++) {
                                k++;
                                var sv = sf.exts[j] !== undefined ? sf.exts[j].value.slice() : [''];
                                var tv = tf.exts[j] !== undefined ? tf.exts[j].value.slice() : [''];
                                inFile.push.apply(inFile, _this.segPairing(sv, tv, "SLIDE" + k, opt.withSeparator));
                                if (sf.exts[j + 1] !== undefined && tf.exts[j + 1] !== undefined) {
                                    if (sf.exts[j + 1].type === 'PPT-Note' || tf.exts[j + 1].type === 'PPT-Note') {
                                        var sv_2 = sf.exts[j + 1].type === 'PPT-Note' ? sf.exts[j + 1].value.slice() : [''];
                                        var tv_2 = tf.exts[j + 1].type === 'PPT-Note' ? tf.exts[j + 1].value.slice() : [''];
                                        inFile.push.apply(inFile, _this.segPairing(sv_2, tv_2, "SLIDE" + k + "-note", opt.withSeparator));
                                        j++;
                                    }
                                }
                            }
                            inFile.push('_@@_ EOF\t_@@_ EOF');
                            aligned.push.apply(aligned, inFile);
                            break;
                        }
                        default: {
                            break;
                        }
                    }
                }
                resolve(aligned);
            }
        });
    };
    CatovisContext.prototype.getAlignStats = function () {
        var statsList = [];
        if (this.src !== null && this.tgt !== null) {
            for (var i = 0; i < this.src.length; i++) {
                var srcStats = new stats_1.FileStats(this.src[i].name, this.src[i].format);
                var tgtStats = new stats_1.FileStats(this.tgt[i].name, this.tgt[i].format);
                for (var _i = 0, _a = this.src[i].exts; _i < _a.length; _i++) {
                    var ext = _a[_i];
                    srcStats.countElement(ext);
                }
                for (var _b = 0, _c = this.tgt[i].exts; _b < _c.length; _b++) {
                    var ext = _c[_b];
                    tgtStats.countElement(ext);
                }
                statsList.push([srcStats, tgtStats]);
            }
        }
        return statsList;
    };
    CatovisContext.prototype.segPairing = function (sVal, tVal, mark, separation) {
        var inSection = [];
        if (separation) {
            inSection.push("_@\u03BB_ " + mark + " _\u03BB@_\t_@\u03BB_ " + mark + " _\u03BB@_");
        }
        var sLen = sVal.length;
        var tLen = tVal.length;
        var larger = sLen >= tLen ? sLen : tLen;
        if (sLen > tLen) {
            var diff = sLen - tLen;
            tVal.push.apply(tVal, Array(diff).fill(''));
        }
        else if (sLen < tLen) {
            var diff = tLen - sLen;
            sVal.push.apply(sVal, Array(diff).fill(''));
        }
        for (var i = 0; i < larger; i++) {
            if (!(sVal[i] === '' && tVal[i] === '')) {
                inSection.push(sVal[i] + "\t" + tVal[i]);
            }
        }
        return inSection;
    };
    return CatovisContext;
}());
exports.CatovisContext = CatovisContext;
