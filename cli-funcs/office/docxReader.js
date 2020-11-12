"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.docxReader = void 0;
var JSZip = require('jszip');
var util_1 = require("../util");
function docxReader(docxFile, fileName, opt) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var zip = new JSZip();
                    var wordContents = {
                        name: fileName,
                        format: 'docx',
                        exts: []
                    };
                    zip.loadAsync(docxFile).then(function (inzip) {
                        if (inzip !== null) {
                            inzip.file('word/document.xml').async('string').then(function (wordxml) {
                                var dom = require('xmldom').DOMParser;
                                var doc = new dom().parseFromString(wordxml);
                                var bodyNd = doc.lastChild.firstChild;
                                var bodyCds = bodyNd.childNodes !== undefined ? bodyNd.childNodes : [];
                                var bodyCdsLen = bodyCds.length;
                                for (var i = 0; i < bodyCdsLen; i++) {
                                    switch (bodyCds[String(i)].nodeName) {
                                        case 'w:p':
                                            var paraTexts = [wordParaReder(bodyCds[String(i)], opt.wordRev)];
                                            paraTexts = util_1.applySegRules(paraTexts, opt);
                                            if (paraTexts.length !== 0) {
                                                var paraContents = {
                                                    type: 'Word-Paragraph',
                                                    position: i,
                                                    isActive: true,
                                                    value: paraTexts
                                                };
                                                wordContents.exts.push(paraContents);
                                            }
                                            break;
                                        case 'w:tbl':
                                            var tblTexts = wordTableReader(bodyCds[String(i)], opt.wordRev);
                                            tblTexts = util_1.applySegRules(tblTexts, opt);
                                            if (tblTexts.length !== 0) {
                                                var tblContents = {
                                                    type: 'Word-Table',
                                                    position: i,
                                                    isActive: true,
                                                    value: tblTexts
                                                };
                                                wordContents.exts.push(tblContents);
                                            }
                                            break;
                                        default:
                                            break;
                                    }
                                }
                                resolve(wordContents);
                            });
                        }
                    })["catch"](function (err) {
                        var fail = {
                            name: fileName,
                            detail: err
                        };
                        reject(fail);
                    });
                })];
        });
    });
}
exports.docxReader = docxReader;
function wordParaReder(pNd, rev) {
    var paraTexts = [];
    var pCds = pNd.childNodes !== undefined ? pNd.childNodes : [];
    var pCdsLen = pCds.length;
    for (var i = 0; i < pCdsLen; i++) {
        switch (pCds[String(i)].nodeName) {
            case 'w:r':
                paraTexts.push(wordRunReader(pCds[String(i)], rev));
                break;
            case 'w:ins':
                if (rev) {
                    var insCds = pCds[String(i)].childNodes;
                    var insCdsLen = insCds.length;
                    for (var j = 0; j < insCdsLen; j++) {
                        paraTexts.push(wordRunReader(insCds[String(j)], rev));
                    }
                }
                break;
            case 'w:del':
                if (!rev) {
                    var insCds = pCds[String(i)].childNodes;
                    var insCdsLen = insCds.length;
                    for (var j = 0; j < insCdsLen; j++) {
                        paraTexts.push(wordRunReader(insCds[String(j)], rev));
                    }
                }
                break;
            default:
                break;
        }
    }
    return paraTexts.join('');
}
function wordTableReader(tblNd, rev) {
    var tableTexts = [];
    var tblCds = tblNd.childNodes !== undefined ? tblNd.childNodes : [];
    var tblCdsLen = tblCds.length;
    for (var i = 0; i < tblCdsLen; i++) {
        if (tblCds[String(i)].nodeName === 'w:tr') {
            var cellNds = tblCds[String(i)].childNodes !== undefined ? tblCds[String(i)].childNodes : [];
            var cellLen = cellNds.length;
            for (var j = 0; j < cellLen; j++) {
                var cellCds = cellNds[String(j)].childNodes !== undefined ? cellNds[String(j)].childNodes : [];
                var cellCdsLen = cellCds.length;
                for (var k = 0; k < cellCdsLen; k++) {
                    if (cellCds[String(k)].nodeName === 'w:p') {
                        var cellText = wordParaReder(cellCds[String(k)], rev);
                        if (cellText !== '') {
                            tableTexts.push(cellText);
                        }
                    }
                }
            }
        }
    }
    return tableTexts;
}
function wordRunReader(rNd, rev) {
    var rCds = rNd.childNodes !== undefined ? rNd.childNodes : [];
    var rCdsLen = rCds.length;
    var textVal = '';
    for (var i = 0; i < rCdsLen; i++) {
        if (rCds[String(i)].firstChild === null) {
            continue;
        }
        switch (rCds[String(i)].nodeName) {
            case 'w:t':
                textVal += rCds[String(i)].firstChild.data;
                break;
            case 'w:tab':
                textVal += '\n';
                break;
            case 'w:delText':
                if (!rev) {
                    var t = rCds[String(i)].firstChild.data !== undefined ? rCds[String(i)].firstChild.data : '';
                    textVal += t;
                }
                break;
            case 'w:instrText':
                textVal += ' ';
                break;
            case 'mc:AlternateContent':
                textVal += wordTboxReader(rCds[String(i)], rev);
                break;
            case 'w:pict':
                var pictCds = rCds[String(i)].childNodes !== undefined ? rCds[String(i)].childNodes : [];
                for (var j = 0; j < pictCds.length; j++) {
                    if (pictCds[String(j)].nodeName !== 'v:shape') {
                        continue;
                    }
                    var shpCds = pictCds[String(j)].childNodes !== undefined ? pictCds[String(j)].childNodes : [];
                    for (var k = 0; k < shpCds.length; k++) {
                        if (shpCds[String(k)].nodeName !== 'v:textbox') {
                            continue;
                        }
                        var vtboxCds = shpCds[String(k)].childNodes !== undefined ? shpCds[String(k)].childNodes : [];
                        for (var l = 0; l < vtboxCds.length; l++) {
                            if (vtboxCds[String(l)].nodeName !== 'w:txbxContent') {
                                continue;
                            }
                            var wtboxCds = vtboxCds[String(l)].childNodes !== undefined ? vtboxCds[String(l)].childNodes : [];
                            for (var m = 0; m < wtboxCds.length; m++) {
                                if (wtboxCds[String(m)].nodeName !== 'w:p') {
                                    continue;
                                }
                                textVal += wordParaReder(wtboxCds[String(m)], rev);
                            }
                        }
                    }
                }
                break;
            default:
                break;
        }
    }
    return textVal;
}
function wordTboxReader(shpNd, rev) {
    var textVal = '';
    var shpCds = shpNd.firstChild.firstChild.firstChild.childNodes !== undefined ? shpNd.firstChild.firstChild.firstChild.childNodes : [];
    var shpCdsLen = shpCds.length;
    var wpsNd;
    for (var i = 0; i < shpCdsLen; i++) {
        if (shpCds[String(i)].nodeName === 'a:graphic') {
            wpsNd = shpCds[String(i)].firstChild.firstChild;
            break;
        }
    }
    var wpsCds = wpsNd.childNodes !== undefined ? wpsNd.childNodes : [];
    var wpsCdsLen = wpsCds.length;
    for (var i = 0; i < wpsCdsLen; i++) {
        if (wpsCds[String(i)].nodeName === 'wps:txbx') {
            var wpsTxConPara = wpsCds[String(i)].firstChild.childNodes !== undefined ? wpsCds[String(i)].firstChild.childNodes : [];
            var wpsTxConParaLen = wpsTxConPara.length;
            for (var j = 0; j < wpsTxConParaLen; j++) {
                textVal += wordParaReder(wpsTxConPara[String(j)], rev);
            }
            break;
        }
    }
    return textVal;
}
