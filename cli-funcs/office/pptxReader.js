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
exports.pptxReader = void 0;
var JSZip = require('jszip');
var xml2js_1 = require("xml2js");
var util_1 = require("../util");
// PPTファイルを読み込むための関数
function pptxReader(pptxFile, fileName, opt) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var zip = new JSZip();
                    zip.loadAsync(pptxFile).then(function (inzip) {
                        var prs = [];
                        var rels = [];
                        // const slideNums = inzip.folder("ppt/slides/_rels/").file(/.rels/).length
                        inzip.folder('ppt/slides/').forEach(function (path, file) { return __awaiter(_this, void 0, void 0, function () {
                            var _a, _b;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        if (!!path.startsWith('_rels')) return [3 /*break*/, 1];
                                        prs.push(slideReader(path, file, opt));
                                        return [3 /*break*/, 3];
                                    case 1:
                                        if (!(path.indexOf('xml') !== -1)) return [3 /*break*/, 3];
                                        _b = (_a = rels).push;
                                        return [4 /*yield*/, pptRelReader(path, file)];
                                    case 2:
                                        _b.apply(_a, [_c.sent()]);
                                        _c.label = 3;
                                    case 3: return [2 /*return*/];
                                }
                            });
                        }); });
                        if (opt.pptNote) {
                            inzip.folder('ppt/notesSlides/').forEach(function (path, file) {
                                if (!path.startsWith('_rels')) {
                                    prs.push(noteReader(path, file, opt));
                                }
                            });
                        }
                        inzip.folder('ppt/diagrams/').forEach(function (path, file) {
                            if (path.startsWith('data') && path.endsWith('.xml')) {
                                prs.push(slideDiagramReader(path, file, opt));
                            }
                        });
                        inzip.folder('ppt/charts/').forEach(function (path, file) {
                            if (path.startsWith('chart') && path.endsWith('.xml')) {
                                prs.push(slideChartReader(path, file, opt));
                            }
                        });
                        Promise.all(prs).then(function (rs) {
                            var datas = [];
                            var noteRelation = {};
                            var dgmRelation = {};
                            for (var _i = 0, rels_1 = rels; _i < rels_1.length; _i++) {
                                var rel = rels_1[_i];
                                if (rel.note !== '') {
                                    noteRelation[rel.note] = Number(rel.main);
                                }
                                if (rel.dgm !== '') {
                                    dgmRelation[rel.dgm] = Number(rel.main);
                                }
                            }
                            for (var _a = 0, rs_1 = rs; _a < rs_1.length; _a++) {
                                var r = rs_1[_a];
                                if (r.value.length === 0) {
                                    continue;
                                }
                                if (r.type === 'PPT-Slide') {
                                    datas.push(r);
                                }
                                else if (r.type === 'PPT-Note') {
                                    r.position = Number(noteRelation[r.position]);
                                    datas.push(r);
                                }
                                else if (r.type === 'PPT-Diagram') {
                                    r.position = Number(dgmRelation[r.position]);
                                    datas.push(r);
                                }
                            }
                            var sortedDatas = datas.sort(function (a, b) {
                                if (a.position > b.position) {
                                    return 1;
                                }
                                if (a.position < b.position) {
                                    return -1;
                                }
                                if (a.position === b.position) {
                                    if (a.type === 'PPT-Slide') {
                                        return -1;
                                    }
                                    else if (b.type === 'PPT-Note' || b.type === 'PPT-Diagram') {
                                        return 1;
                                    }
                                    else {
                                        return 0;
                                    }
                                }
                            });
                            var pptContents = {
                                name: fileName,
                                format: 'pptx',
                                exts: sortedDatas
                            };
                            resolve(pptContents);
                        });
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
exports.pptxReader = pptxReader;
function slideReader(path, fileObj, opt) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) {
                    fileObj.async('string').then(function (slide) {
                        xml2js_1.parseString(slide, function (err, root) {
                            if (err) {
                                console.log(err);
                            }
                            else {
                                var textInSlide = [];
                                var pTree = root['p:sld']['p:cSld'][0]['p:spTree'][0] !== undefined ? root['p:sld']['p:cSld'][0]['p:spTree'][0] : {};
                                var groups = pTree['p:grpSp'] !== undefined ? pTree['p:grpSp'] : [];
                                var shapes = pTree['p:sp'] !== undefined ? pTree['p:sp'] : [];
                                for (var _i = 0, groups_1 = groups; _i < groups_1.length; _i++) {
                                    var group = groups_1[_i];
                                    if (group['p:sp'] === undefined) {
                                        continue;
                                    }
                                    shapes.push.apply(shapes, group['p:sp']);
                                }
                                for (var _a = 0, shapes_1 = shapes; _a < shapes_1.length; _a++) {
                                    var shape = shapes_1[_a];
                                    if (shape['p:txBody'] === undefined) {
                                        continue;
                                    }
                                    var paras = shape['p:txBody'][0]['a:p'] !== undefined ? shape['p:txBody'][0]['a:p'] : [];
                                    for (var _b = 0, paras_1 = paras; _b < paras_1.length; _b++) {
                                        var para = paras_1[_b];
                                        var runs = para['a:r'];
                                        if (runs === undefined) {
                                            continue;
                                        }
                                        else {
                                            var runs_3 = para['a:r'] !== undefined ? para['a:r'] : [];
                                            var textInPara = '';
                                            for (var _c = 0, runs_1 = runs_3; _c < runs_1.length; _c++) {
                                                var run = runs_1[_c];
                                                if (run['a:t'] === undefined) {
                                                    continue;
                                                }
                                                textInPara += run['a:t'];
                                            }
                                            textInSlide.push(textInPara.replace('\t', '\n'));
                                        }
                                    }
                                }
                                var gFrames = pTree['p:graphicFrame'] !== undefined ? pTree['p:graphicFrame'] : [];
                                for (var _d = 0, gFrames_1 = gFrames; _d < gFrames_1.length; _d++) {
                                    var gFrame = gFrames_1[_d];
                                    if (gFrame['a:graphic'] === undefined) {
                                        continue;
                                    }
                                    if (gFrame['a:graphic'][0]['a:graphicData'] === undefined) {
                                        continue;
                                    }
                                    var tables = gFrame['a:graphic'][0]['a:graphicData'][0]['a:tbl'] !== undefined ? gFrame['a:graphic'][0]['a:graphicData'][0]['a:tbl'] : [];
                                    for (var _e = 0, tables_1 = tables; _e < tables_1.length; _e++) {
                                        var table = tables_1[_e];
                                        var rows = table['a:tr'] !== undefined ? table['a:tr'] : [];
                                        for (var _f = 0, rows_1 = rows; _f < rows_1.length; _f++) {
                                            var row = rows_1[_f];
                                            var cells = row['a:tc'] !== undefined ? row['a:tc'] : [];
                                            for (var _g = 0, cells_1 = cells; _g < cells_1.length; _g++) {
                                                var cell = cells_1[_g];
                                                var paras = cell['a:txBody'][0]['a:p'] !== undefined ? cell['a:txBody'][0]['a:p'] : [];
                                                var textInCell = '';
                                                for (var _h = 0, paras_2 = paras; _h < paras_2.length; _h++) {
                                                    var para = paras_2[_h];
                                                    var runs = para['a:r'] !== undefined ? para['a:r'] : [];
                                                    for (var _j = 0, runs_2 = runs; _j < runs_2.length; _j++) {
                                                        var run = runs_2[_j];
                                                        textInCell += run['a:t'];
                                                    }
                                                    textInCell += '\n';
                                                }
                                                textInSlide.push(textInCell.replace('\t', '\n'));
                                            }
                                        }
                                    }
                                }
                                var slideContents = {
                                    type: 'PPT-Slide',
                                    position: Number(path.replace('slide', '').replace('.xml', '')),
                                    isActive: true,
                                    value: util_1.applySegRules(textInSlide, opt)
                                };
                                resolve(slideContents);
                            }
                        });
                    });
                })];
        });
    });
}
function pptRelReader(path, fileObj) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) {
                    fileObj.async('string').then(function (rel) {
                        xml2js_1.parseString(rel, function (err, root) {
                            if (err) {
                                console.log(err);
                            }
                            else {
                                var relInfo = {
                                    main: path.replace('_rels/slide', '').replace('.xml.rels', ''),
                                    note: '',
                                    dgm: '',
                                    chart: ''
                                };
                                for (var _i = 0, _a = root.Relationships.Relationship; _i < _a.length; _i++) {
                                    var r = _a[_i];
                                    if (r.$.Target.startsWith('../notesSlides')) {
                                        relInfo.note = r.$.Target.replace('../notesSlides/notesSlide', '').replace('.xml', '');
                                    }
                                    if (r.$.Target.startsWith('../diagrams/data')) {
                                        relInfo.dgm = r.$.Target.replace('../diagrams/data', '').replace('.xml', '');
                                    }
                                    if (r.$.Target.startsWith('../charts/')) {
                                        relInfo.dgm = r.$.Target.replace('../charts/chart', '').replace('.xml', '');
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
function noteReader(path, fileObj, opt) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) {
                    fileObj.async('string').then(function (note) {
                        xml2js_1.parseString(note, function (err, root) {
                            if (err) {
                                console.log(err);
                            }
                            else {
                                var textInNote = [];
                                var pTree = root['p:notes']['p:cSld'][0]['p:spTree'][0] !== undefined ? root['p:notes']['p:cSld'][0]['p:spTree'][0] : {};
                                var shapes = pTree['p:sp'] !== undefined ? pTree['p:sp'] : [];
                                for (var _i = 0, shapes_2 = shapes; _i < shapes_2.length; _i++) {
                                    var shape = shapes_2[_i];
                                    var txBody = shape['p:txBody'] !== undefined ? shape['p:txBody'] : [];
                                    if (txBody.length === 0) {
                                        continue;
                                    }
                                    var paras = txBody[0]['a:p'] !== undefined ? txBody[0]['a:p'] : [];
                                    for (var _a = 0, paras_3 = paras; _a < paras_3.length; _a++) {
                                        var para = paras_3[_a];
                                        var textInPara = [];
                                        var runs = para['a:r'] !== undefined ? para['a:r'] : [];
                                        for (var _b = 0, runs_4 = runs; _b < runs_4.length; _b++) {
                                            var run = runs_4[_b];
                                            if (run['a:t'][0] !== '' && run['a:t'][0] !== '\t') {
                                                textInPara.push.apply(textInPara, run['a:t']);
                                            }
                                        }
                                        textInNote.push(textInPara.join(''));
                                    }
                                }
                                var noteContents = {
                                    type: 'PPT-Note',
                                    position: Number(path.replace('notesSlide', '').replace('.xml', '')),
                                    isActive: true,
                                    value: util_1.applySegRules(textInNote, opt)
                                };
                                resolve(noteContents);
                            }
                        });
                    });
                })];
        });
    });
}
function slideDiagramReader(path, fileObj, opt) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) {
                    fileObj.async('string').then(function (dgm) {
                        xml2js_1.parseString(dgm, function (err, root) {
                            if (err) {
                                console.log(err);
                            }
                            else {
                                var textInDiagram = [];
                                var patterns = root['dgm:dataModel']['dgm:ptLst'][0]['dgm:pt'] !== undefined ? root['dgm:dataModel']['dgm:ptLst'][0]['dgm:pt'] : [];
                                for (var _i = 0, patterns_1 = patterns; _i < patterns_1.length; _i++) {
                                    var pattern = patterns_1[_i];
                                    var dgmt = pattern['dgm:t'] !== undefined ? pattern['dgm:t'] : [];
                                    if (dgmt.length === 0) {
                                        continue;
                                    }
                                    var dgmtp = dgmt[0]['a:p'] !== undefined ? dgmt[0]['a:p'] : [];
                                    if (dgmtp.length === 0) {
                                        continue;
                                    }
                                    var dgmtprun = dgmtp[0]['a:r'] !== undefined ? dgmtp[0]['a:r'] : [];
                                    if (dgmtprun.length === 0) {
                                        continue;
                                    }
                                    textInDiagram.push.apply(textInDiagram, dgmtprun[0]['a:t']);
                                }
                                var dgmContents = {
                                    type: 'PPT-Diagram',
                                    position: Number(path.replace('data', '').replace('.xml', '')),
                                    isActive: true,
                                    value: util_1.applySegRules(textInDiagram, opt)
                                };
                                resolve(dgmContents);
                            }
                        });
                    });
                })];
        });
    });
}
function slideChartReader(path, fileObj, opt) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    fileObj.async('string').then(function (cht) {
                        xml2js_1.parseString(cht, function (err, root) {
                            if (err) {
                                console.log(err);
                            }
                            else {
                                var textInChart = [];
                                var chart = root['c:chartSpace']['c:chart'][0] !== undefined ? root['c:chartSpace']['c:chart'][0] : {};
                                var titleRuns = void 0;
                                try {
                                    titleRuns = chart['c:title'][0]['c:tx'][0]['c:rich'][0]['a:p'][0]['a:r'];
                                }
                                catch (e) {
                                    // console.log(e)
                                    titleRuns = [];
                                }
                                var title = '';
                                for (var i = 0; i < titleRuns.length; i++) {
                                    title += titleRuns[i]['a:t'];
                                }
                                if (title !== '') {
                                    textInChart.push(title);
                                }
                                console.log(textInChart)
                                var plots = chart['c:plotArea'] !== undefined ? chart['c:plotArea'] : [];
                                var 
                                for (let i = 0; i < plots.length; i++) {
                                    console.log(plots);
                                }
                                
                                // for (const pattern of patterns) {
                                //   const dgmt: any[] = pattern['dgm:t'] !== undefined ? pattern['dgm:t'] : []
                                //   if (dgmt.length === 0) {
                                //     continue
                                //   }
                                //   const dgmtp: any[] = dgmt[0]['a:p'] !== undefined ? dgmt[0]['a:p'] : []
                                //   if (dgmtp.length === 0) {
                                //     continue
                                //   }
                                //   const dgmtprun: any[] = dgmtp[0]['a:r'] !== undefined ? dgmtp[0]['a:r'] : []
                                //   if (dgmtprun.length === 0) {
                                //     continue
                                //   }
                                //   textInChart.push(...dgmtprun[0]['a:t'])
                                // }
                                var chartContents = {
                                    type: 'PPT-Diagram',
                                    position: Number(path.replace('chart', '').replace('.xml', '')),
                                    isActive: true,
                                    value: util_1.applySegRules(textInChart, opt)
                                };
                                resolve(chartContents);
                            }
                        });
                    });
                })];
        });
    });
}
