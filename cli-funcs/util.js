"use strict";
exports.__esModule = true;
exports.applyOpcodes = exports.regexExclusion = exports.splitSegmentation = exports.applySegRules = exports.blobContentsReader = exports.cnm = void 0;
var docxReader_1 = require("./office/docxReader");
var xlsxReader_1 = require("./office/xlsxReader");
var pptxReader_1 = require("./office/pptxReader");
var option_1 = require("./option");
function cnm(data) {
    console.log(data);
}
exports.cnm = cnm;
function blobContentsReader(files, order, opq) {
    var que = opq !== undefined ? opq : {};
    var opt = new option_1.ReadingOption(que);
    return new Promise(function (resolve, reject) {
        var prs = [];
        for (var _i = 0, order_1 = order; _i < order_1.length; _i++) {
            var ox = order_1[_i];
            var fileName = files[ox].name;
            if (fileName.endsWith('.docx')) {
                prs.push(docxReader_1.docxReader(files[ox], fileName, opt));
            }
            else if (fileName.endsWith('.xlsx')) {
                prs.push(xlsxReader_1.xlsxReader(files[ox], fileName, opt));
            }
            else if (fileName.endsWith('.pptx')) {
                prs.push(pptxReader_1.pptxReader(files[ox], fileName, opt));
            }
        }
        Promise.all(prs).then(function (res) {
            resolve(res);
        })["catch"](function (failure) {
            reject(failure);
        });
    });
}
exports.blobContentsReader = blobContentsReader;
function applySegRules(textVal, opt) {
    if (!opt.segmentation && !opt.exclusion) {
        return textVal;
    }
    var applyedValue = [];
    var delim;
    if (opt.segmentation) {
        delim = new RegExp(opt.delimiters, 'g');
    }
    var ex;
    if (opt.excluding) {
        ex = new RegExp(opt.exclusion);
    }
    textVal.map(function (val) {
        var newVal = [val];
        if (opt.segmentation) {
            newVal = splitSegmentation(val, delim);
        }
        if (opt.excluding) {
            applyedValue.push.apply(applyedValue, regexExclusion(newVal, ex));
        }
        else {
            applyedValue.push.apply(applyedValue, newVal);
        }
    });
    return applyedValue;
}
exports.applySegRules = applySegRules;
function splitSegmentation(text, delimiters) {
    var t = text.replace(delimiters, '$1\n');
    var ts = t.split('\n').filter(function (val) {
        return val !== '';
    });
    return ts;
}
exports.splitSegmentation = splitSegmentation;
function regexExclusion(texts, ex) {
    var excluded = texts.filter(function (val) {
        return !ex.test(val);
    });
    return excluded;
}
exports.regexExclusion = regexExclusion;
function applyOpcodes(original, diffed, opcodes) {
    // OpcodeのDelete / Replace 用にオリジナルテキストをとっておく
    var crtSegment = original;
    // 類似テキストを一つずつ取得して処理
    var tagged = diffed.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    var processCodes = opcodes.reverse();
    for (var _i = 0, processCodes_1 = processCodes; _i < processCodes_1.length; _i++) {
        var processCode = processCodes_1[_i];
        switch (processCode[0]) {
            case 'equal':
            case '=':
                break;
            case 'delete':
            case '-':
                tagged =
                    tagged.slice(0, processCode[3]) +
                        '<span class="ins">' + crtSegment.slice(processCode[1], processCode[2]) + '</span>' +
                        tagged.slice(processCode[4]);
                break;
            case 'replace':
            case '~':
                tagged =
                    tagged.slice(0, processCode[3]) +
                        '<span class="ins">' + crtSegment.slice(processCode[1], processCode[2]) + '</span>' +
                        '<span class="del">' + tagged.slice(processCode[3], processCode[4]) + '</span>' +
                        tagged.slice(processCode[4]);
                break;
            case 'insert':
            case '+':
                tagged =
                    tagged.slice(0, processCode[3]) +
                        '<span class="del">' + tagged.slice(processCode[3], processCode[4]) + '</span>' +
                        tagged.slice(processCode[4]);
                break;
            default:
                break;
        }
    }
    return tagged;
}
exports.applyOpcodes = applyOpcodes;
