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
exports.xlsxReader = void 0;
var JSZip = require('jszip');
var xml2js_1 = require("xml2js");
var util_1 = require("../util");
// Excelファイルを読み込むための関数
function xlsxReader(xlsxFile, fileName, opt) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var zip = new JSZip();
                    zip.loadAsync(xlsxFile).then(function (inzip) {
                        // const wsNums = inzip.folder("xl/worksheets/_rels/").file(/.rels/).length
                        inzip.file('xl/sharedStrings.xml').async('string').then(function (sst) { return __awaiter(_this, void 0, void 0, function () {
                            var _this = this;
                            return __generator(this, function (_a) {
                                xml2js_1.parseString(sst, function (err, root) { return __awaiter(_this, void 0, void 0, function () {
                                    var shared, notHidden, filled;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                if (!err) return [3 /*break*/, 1];
                                                reject(err);
                                                return [3 /*break*/, 4];
                                            case 1:
                                                shared = root.sst.si.map(function (val) {
                                                    if (val.t !== undefined) {
                                                        // return val.t.join('')
                                                        if (val.t[0].$ !== undefined) {
                                                            return val.t[0]._ !== undefined ? val.t[0]._ : ' ';
                                                        }
                                                        else {
                                                            return val.t.join('');
                                                        }
                                                    }
                                                    else if (val.r !== undefined) {
                                                        return val.r.map(function (rVal) {
                                                            if (rVal.t[0].$ !== undefined) {
                                                                return rVal.t[0]._ !== undefined ? rVal.t[0]._ : ' ';
                                                            }
                                                            else {
                                                                return rVal.t.join('');
                                                            }
                                                        }).join('');
                                                    }
                                                });
                                                return [4 /*yield*/, workbookRelReader(inzip, opt.excelReadHidden)];
                                            case 2:
                                                notHidden = _a.sent();
                                                return [4 /*yield*/, styleRelReader(inzip, opt)];
                                            case 3:
                                                filled = _a.sent();
                                                xlsxContentsReader(inzip, shared, notHidden, filled, opt).then(function (datas) {
                                                    var sortedDatas = datas.sort(function (a, b) {
                                                        if (a.position > b.position) {
                                                            return 1;
                                                        }
                                                        if (a.position < b.position) {
                                                            return -1;
                                                        }
                                                        if (a.position === b.position) {
                                                            if (a.type === 'Excel-Sheet') {
                                                                return -1;
                                                            }
                                                            else if (b.type === 'Excel-Shape') {
                                                                return 1;
                                                            }
                                                            return 0;
                                                        }
                                                    });
                                                    var excelContents = {
                                                        name: fileName,
                                                        format: 'xlsx',
                                                        exts: sortedDatas
                                                    };
                                                    resolve(excelContents);
                                                });
                                                _a.label = 4;
                                            case 4: return [2 /*return*/];
                                        }
                                    });
                                }); });
                                return [2 /*return*/];
                            });
                        }); });
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
exports.xlsxReader = xlsxReader;
// 非表示のシートを読み飛ばすための関数
function workbookRelReader(zipOjt, readHidden) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    zipOjt.file('xl/workbook.xml').async('string').then(function (wb) {
                        xml2js_1.parseString(wb, function (err, root) {
                            if (err) {
                                console.log(err);
                            }
                            else {
                                var sheets = root.workbook.sheets[0].sheet;
                                var sheetsNum = sheets.length;
                                var necesaries = Array(sheetsNum).fill(true);
                                if (!readHidden) {
                                    for (var i = 0; i < sheetsNum; i++) {
                                        necesaries[i] = sheets[i].$.state !== 'hidden';
                                    }
                                }
                                resolve(necesaries);
                            }
                        });
                    });
                })];
        });
    });
}
// 特定の色のセルを読み飛ばすための関数
function styleRelReader(zipOjt, opt) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    zipOjt.file('xl/styles.xml').async('string').then(function (styles) {
                        xml2js_1.parseString(styles, function (err, root) {
                            if (err) {
                                console.log(err);
                                reject(err);
                            }
                            else {
                                var filled = [];
                                var myStyle = root.styleSheet;
                                if (myStyle === undefined) {
                                    reject('styles.xml not found');
                                }
                                var xfs = myStyle.cellXfs !== undefined ? myStyle.cellXfs : undefined;
                                if (xfs === undefined || xfs[0] === undefined) {
                                    resolve(['0']);
                                }
                                var xfNds = xfs[0].xf !== undefined ? xfs[0].xf : [];
                                for (var i = 0; i < xfNds.length; i++) {
                                    filled.push(xfNds[i].$.fillId);
                                }
                                resolve(filled);
                            }
                        });
                    });
                })];
        });
    });
}
function xlsxContentsReader(zipOjt, shared, notHidden, filled, opt) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) {
                    var prs = [];
                    var rels = [];
                    zipOjt.folder('xl/worksheets/').forEach(function (path, file) { return __awaiter(_this, void 0, void 0, function () {
                        var _a, _b;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    if (!!path.startsWith('_rels')) return [3 /*break*/, 1];
                                    prs.push(eachSheetReader(path, file, shared, filled, opt));
                                    return [3 /*break*/, 3];
                                case 1:
                                    if (!(path.indexOf('xml') !== -1)) return [3 /*break*/, 3];
                                    _b = (_a = rels).push;
                                    return [4 /*yield*/, wsRelReader(path, file)];
                                case 2:
                                    _b.apply(_a, [_c.sent()]);
                                    _c.label = 3;
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    zipOjt.folder('xl/drawings/').forEach(function (path, file) {
                        if (!path.startsWith('_rels') && !path.endsWith('.vml')) {
                            prs.push(eachDrawingReader(path, file, opt));
                        }
                    });
                    Promise.all(prs).then(function (rs) {
                        var datas = [];
                        var relation = {};
                        for (var _i = 0, rels_1 = rels; _i < rels_1.length; _i++) {
                            var rel = rels_1[_i];
                            relation[rel.sub] = Number(rel.main);
                        }
                        for (var _a = 0, rs_1 = rs; _a < rs_1.length; _a++) {
                            var r = rs_1[_a];
                            if (r.value.length === 0) {
                                continue;
                            }
                            if (r.type === 'Excel-Sheet') {
                                r.isActive = notHidden[r.position - 1];
                                datas.push(r);
                            }
                            else if (r.type === 'Excel-Shape') {
                                r.position = relation[r.position];
                                r.isActive = notHidden[r.position - 1];
                                datas.push(r);
                            }
                        }
                        resolve(datas);
                    });
                })];
        });
    });
}
function wsRelReader(path, fileObj) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) {
                    fileObj.async('string').then(function (relxml) {
                        xml2js_1.parseString(relxml, function (err, root) {
                            if (err) {
                                console.log(err);
                            }
                            else {
                                var relInfo = {
                                    main: path.replace('_rels/sheet', '').replace('.xml.rels', ''),
                                    sub: ''
                                };
                                for (var _i = 0, _a = root.Relationships.Relationship; _i < _a.length; _i++) {
                                    var rel = _a[_i];
                                    if (rel.$.Target.startsWith('../drawings/')) {
                                        relInfo.sub = rel.$.Target.replace('../drawings/drawing', '').replace('.xml', '');
                                    }
                                }
                                resolve(relInfo);
                            }
                        });
                    });
                })];
        });
    });
}
function eachSheetReader(path, fileObj, shared, filled, opt) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) {
                    fileObj.async('string').then(function (sht) {
                        xml2js_1.parseString(sht, function (err, root) {
                            if (err) {
                                console.log(err);
                            }
                            else {
                                var rows = root.worksheet.sheetData[0].row !== undefined ? root.worksheet.sheetData[0].row : [];
                                var textInSheet = [];
                                for (var _i = 0, rows_1 = rows; _i < rows_1.length; _i++) {
                                    var row = rows_1[_i];
                                    if (row.c === undefined) {
                                        continue;
                                    }
                                    for (var _a = 0, _b = row.c; _a < _b.length; _a++) {
                                        var col = _b[_a];
                                        if (col.$.s !== undefined) {
                                            if (!opt.excelReadFilled) {
                                                if (filled[Number(col.$.s)] !== '0') {
                                                    continue;
                                                }
                                            }
                                        }
                                        if (col.$.t === 's') {
                                            textInSheet.push(shared[col.v]);
                                        }
                                    }
                                }
                                var sheetContents = {
                                    type: 'Excel-Sheet',
                                    position: Number(path.replace('sheet', '').replace('.xml', '')),
                                    isActive: true,
                                    value: util_1.applySegRules(textInSheet, opt)
                                };
                                resolve(sheetContents);
                            }
                        });
                    });
                })];
        });
    });
}
function eachDrawingReader(path, fileObj, opt) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) {
                    fileObj.async('string').then(function (sht) {
                        xml2js_1.parseString(sht, function (err, root) {
                            if (err) {
                                console.log(err);
                            }
                            else {
                                var shapes = root['xdr:wsDr']['xdr:twoCellAnchor'] !== undefined ? root['xdr:wsDr']['xdr:twoCellAnchor'] : [];
                                var drawingText = [];
                                for (var _i = 0, shapes_1 = shapes; _i < shapes_1.length; _i++) {
                                    var shape = shapes_1[_i];
                                    if (shape['xdr:sp'] === undefined) {
                                        continue;
                                    }
                                    if (shape['xdr:sp'][0]['xdr:txBody'] === undefined) {
                                        continue;
                                    }
                                    var shapePara = shape['xdr:sp'][0]['xdr:txBody'][0]['a:p'] !== undefined ? shape['xdr:sp'][0]['xdr:txBody'][0]['a:p'] : [];
                                    for (var _a = 0, shapePara_1 = shapePara; _a < shapePara_1.length; _a++) {
                                        var para = shapePara_1[_a];
                                        if (para['a:r'] === undefined) {
                                            continue;
                                        }
                                        drawingText.push(para['a:r'].map(function (val) {
                                            if (val['a:t'] !== undefined) {
                                                return val['a:t'];
                                            }
                                        }).join(''));
                                    }
                                }
                                var shapeContents = {
                                    type: 'Excel-Shape',
                                    position: Number(path.replace('drawing', '').replace('.xml', '')),
                                    isActive: true,
                                    value: util_1.applySegRules(drawingText, opt)
                                };
                                resolve(shapeContents);
                            }
                        });
                    });
                })];
        });
    });
}
