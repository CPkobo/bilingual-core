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
exports.pathContentsReader = void 0;
var fs_1 = require("fs");
var extract_1 = require("./cli-funcs/extract");
var option_1 = require("./cli-funcs/option");
var diff_1 = require("./cli-funcs/diff");
var tovis_1 = require("./cli-funcs/tovis");
var docxReader_1 = require("./cli-funcs/office/docxReader");
var xlsxReader_1 = require("./cli-funcs/office/xlsxReader");
var pptxReader_1 = require("./cli-funcs/office/pptxReader");
var util_1 = require("./cli-funcs/util");
function pathContentsReader(paths, opq) {
    var que = opq !== undefined ? opq : {};
    var opt = new option_1.ReadingOption(que);
    return new Promise(function (resolve, reject) {
        var prs = [];
        for (var _i = 0, paths_1 = paths; _i < paths_1.length; _i++) {
            var path = paths_1[_i];
            var read = fs_1.readFileSync(path);
            if (path.endsWith('.docx')) {
                prs.push(docxReader_1.docxReader(read, path, opt));
            }
            else if (path.endsWith('.xlsx')) {
                prs.push(xlsxReader_1.xlsxReader(read, path, opt));
            }
            else if (path.endsWith('.pptx')) {
                prs.push(pptxReader_1.pptxReader(read, path, opt));
            }
        }
        Promise.all(prs).then(function (res) {
            resolve(res);
        })["catch"](function (failure) {
            reject(failure);
        });
    });
}
exports.pathContentsReader = pathContentsReader;
var modeChoices = ['EXTRACT', 'ALIGN', 'COUNT', 'DIFF', 'TOVIS'];
var CLIParams = /** @class */ (function () {
    function CLIParams(args) {
        this.sFiles = [];
        this.tFiles = [];
        this.validated = false;
        if (args.mode !== undefined && modeChoices.indexOf(args.mode) !== -1) {
            this.mode = args.mode;
        }
        else {
            this.mode = 'EXTRACT';
        }
        if (args.args !== undefined && args.args[0] !== undefined) {
            this.source = args.args[0];
        }
        else if (args.source !== undefined) {
            this.source = args.source !== '' ? args.source : './';
        }
        else {
            this.source = './';
        }
        if (args.target !== undefined) {
            this.target = args.target !== '' ? args.target : './';
        }
        else {
            this.target = './';
        }
        this.oFile = args.output !== undefined ? args.output : '';
        if (this.oFile === undefined) {
            this.oMode = 'console';
        }
        else if (this.oFile.endsWith('.json')) {
            this.oMode = 'json';
        }
        else if (this.oFile.endsWith('.txt') || this.oFile.endsWith('.tsv')) {
            this.oMode = 'plain';
        }
        else {
            this.oMode = 'console';
        }
        this.excluding = args.exclusion === undefined;
        this.exclusion = args.exclusion !== undefined ? args.exclusion : '';
        this.wordRev = true;
        this.withSeparator = true;
        this.pptNote = true;
        this.excelReadHidden = true;
        this.excelReadFilled = true;
        var others = args.others !== undefined ? args.others.split(',') : [];
        for (var _i = 0, others_1 = others; _i < others_1.length; _i++) {
            var other = others_1[_i];
            other = other.toLowerCase();
            switch (other) {
                case 'without-separator':
                case 'wosep':
                    this.withSeparator = false;
                case 'word-before-rev':
                case 'norev':
                    this.wordRev = false;
                    break;
                case 'ppt-note':
                case 'note':
                    this.pptNote = false;
                    break;
                case 'excel-hidden-sheet':
                case 'hide':
                    this.excelReadHidden = false;
                    break;
                case 'excel-filled-cell':
                case 'filled':
                    this.excelReadFilled = false;
                    break;
                case 'debug':
                    this.oMode = '';
                    break;
                default:
                    break;
            }
        }
    }
    CLIParams.prototype.updateFromDialog = function (ans) {
        this.mode = ans.mode;
        this.excluding = ans.exclusion !== '';
        this.exclusion = ans.exclusion;
        this.withSeparator = ans.withSeparator;
        this.source = ans.source !== '' ? ans.source : './';
        if (ans.target !== undefined) {
            this.target = ans.target !== '' ? ans.target : './';
        }
        switch (this.mode) {
            case 'EXTRACT':
                if (ans.outputFile === undefined || ans.outputFile === '') {
                    this.oFile = '';
                    this.oMode = 'console';
                }
                else if (ans.outputFile.endsWith('.txt')) {
                    this.oFile = ans.outputFile;
                    this.oMode = 'plain';
                }
                else if (ans.outputFile.endsWith('.json')) {
                    this.oFile = ans.outputFile;
                    this.oMode = 'json';
                }
                else {
                    this.oFile = ans.outputFile + '.txt';
                    this.oMode = 'plain';
                }
                break;
            case 'ALIGN':
                if (ans.outputFile === undefined || ans.outputFile === '') {
                    this.oFile = '';
                    this.oMode = 'console';
                }
                else if (ans.outputFile.endsWith('.tsv')) {
                    this.oFile = ans.outputFile;
                    this.oMode = 'plain';
                }
                else if (ans.outputFile.endsWith('.json')) {
                    this.oFile = ans.outputFile;
                    this.oMode = 'json';
                }
                else {
                    this.oFile = ans.outputFile + '.tsv';
                    this.oMode = 'plain';
                }
                break;
            case 'COUNT':
                if (ans.outputFile === undefined || ans.outputFile === '') {
                    this.oFile = '';
                    this.oMode = 'console';
                }
                else if (ans.outputFile.endsWith('.tsv')) {
                    this.oFile = ans.outputFile;
                    this.oMode = 'plain';
                }
                else if (ans.outputFile.endsWith('.json')) {
                    this.oFile = ans.outputFile;
                    this.oMode = 'json';
                }
                else {
                    this.oFile = ans.outputFile + '.tsv';
                    this.oMode = 'plain';
                }
                break;
            case 'DIFF':
                if (ans.outputFile === undefined || ans.outputFile === '') {
                    this.oFile = '';
                    this.oMode = 'console';
                }
                else if (ans.outputFile.endsWith('.json')) {
                    this.oFile = ans.outputFile;
                    this.oMode = 'json';
                }
                else {
                    this.oFile = ans.outputFile + '.json';
                    this.oMode = 'json';
                }
                break;
            case 'TOVIS':
                if (ans.outputFile === undefined || ans.outputFile === '') {
                    this.oFile = '';
                    this.oMode = 'console';
                }
                else if (ans.outputFile.endsWith('.tovis')) {
                    this.oFile = ans.outputFile;
                    this.oMode = 'plain';
                }
                else if (ans.outputFile.endsWith('.json')) {
                    this.oFile = ans.outputFile;
                    this.oMode = 'json';
                }
                else {
                    this.oFile = ans.outputFile + '.tovis';
                    this.oMode = 'plain';
                }
                break;
            default:
                break;
        }
        for (var _i = 0, _a = ans.others; _i < _a.length; _i++) {
            var other = _a[_i];
            switch (other) {
                case 'Dont add separation marks':
                    this.withSeparator = false;
                    break;
                case 'Word-Before-Revision':
                    this.wordRev = false;
                    break;
                case 'PPT-Note':
                    this.pptNote = false;
                    break;
                case 'Excel-Hidden-Sheet':
                    this.excelReadHidden = false;
                    break;
                case 'Excel-Filled-Cell':
                    this.excelReadFilled = false;
                    break;
                case 'DEBUG':
                    this.oMode = '';
                    break;
                default:
                    break;
            }
        }
    };
    CLIParams.prototype.executeByParams = function () {
        var _this = this;
        var err = this.validate();
        if (err !== '') {
            util_1.cnm("Validation Error: " + err);
            return;
        }
        // cnm(JSON.stringify(this, null, 2))
        var opt = this.exportAsOptionQue();
        console.log('------------------------');
        var prs = [];
        prs.push(pathContentsReader(this.sFiles, opt));
        if (this.mode === 'ALIGN') {
            prs.push(pathContentsReader(this.tFiles, opt));
        }
        Promise.all(prs).then(function (ds) {
            var cxt = new extract_1.CatovisContext();
            var diff = new diff_1.DiffInfo();
            switch (_this.mode) {
                case 'EXTRACT':
                    cxt.readContent(ds[0]);
                    _this.cliOutlet('EXTRACT', opt, _this.oMode, _this.oFile, { cxt: cxt });
                    break;
                case 'COUNT':
                    diff.analyze(ds[0]);
                    diff.calcWWC('chara');
                    _this.cliOutlet('COUNT', opt, _this.oMode, _this.oFile, { diff: diff });
                    break;
                case 'DIFF':
                    diff.analyze(ds[0]);
                    _this.cliOutlet('DIFF', opt, _this.oMode, _this.oFile, { diff: diff });
                    break;
                case 'ALIGN':
                    cxt.readContent(ds[0], ds[1]);
                    _this.cliOutlet('ALIGN', opt, _this.oMode, _this.oFile, { cxt: cxt });
                    break;
                case 'TOVIS':
                    diff.analyze(ds[0]);
                    _this.cliOutlet('TOVIS', opt, _this.oMode, _this.oFile, { diff: diff });
                    break;
                default:
                    break;
            }
        })["catch"](function (failure) {
            console.log("Error occured at " + failure.name);
            console.log('--------For more details, please see below-----------');
            console.log(failure.detail);
            console.log('-----------------------------------------------------');
        });
    };
    CLIParams.prototype.cliOutlet = function (eMode, opt, oMode, oFile, data) {
        return __awaiter(this, void 0, void 0, function () {
            var result, _a, format, tovis;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        result = [];
                        _a = eMode;
                        switch (_a) {
                            case 'EXTRACT': return [3 /*break*/, 1];
                            case 'ALIGN': return [3 /*break*/, 5];
                            case 'COUNT': return [3 /*break*/, 8];
                            case 'DIFF': return [3 /*break*/, 9];
                            case 'TOVIS': return [3 /*break*/, 10];
                        }
                        return [3 /*break*/, 11];
                    case 1:
                        if (!(data.cxt !== undefined)) return [3 /*break*/, 4];
                        if (!(oMode === 'json')) return [3 /*break*/, 2];
                        result = [JSON.stringify(data.cxt.getRawContent('src'), null, 2)];
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, data.cxt.getSingleText('src', opt)];
                    case 3:
                        result = _b.sent();
                        _b.label = 4;
                    case 4: return [3 /*break*/, 11];
                    case 5:
                        if (!(data.cxt !== undefined)) return [3 /*break*/, 7];
                        return [4 /*yield*/, data.cxt.getAlignedText(opt)];
                    case 6:
                        result = _b.sent();
                        _b.label = 7;
                    case 7: return [3 /*break*/, 11];
                    case 8:
                        if (data.diff !== undefined) {
                            format = oMode === 'json' ? 'json' : 'human';
                            result = [data.diff.exportResult('wwc-chara', format)];
                        }
                        return [3 /*break*/, 11];
                    case 9:
                        if (data.diff !== undefined) {
                            result = [data.diff.exportResult("diff", "json")];
                        }
                        return [3 /*break*/, 11];
                    case 10:
                        tovis = new tovis_1.Tovis();
                        if (data.diff !== undefined) {
                            tovis.parseDiffInfo(data.diff.dsegs);
                            if (oFile.endsWith('tovis')) {
                                result = tovis.dump();
                            }
                            else {
                                result = [tovis.dumpToJson()];
                            }
                        }
                        return [3 /*break*/, 11];
                    case 11:
                        switch (oMode) {
                            case 'console':
                                console.log(result.join('\n'));
                                break;
                            case 'json':
                            case 'plain':
                                fs_1.writeFileSync("./" + oFile, result.join('\n'));
                                break;
                            default:
                                break;
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    CLIParams.prototype.exportAsOptionQue = function () {
        return {
            name: 'via-cli',
            withSeparator: this.withSeparator,
            excluding: this.excluding,
            exclusion: this.exclusion,
            segmentation: true,
            delimiters: '(\\。|\\. |\\! |\\? |\\！|\\？)',
            wordRev: this.wordRev,
            excelReadHidden: this.excelReadHidden,
            excelReadFilled: this.excelReadFilled,
            pptNote: this.pptNote
        };
    };
    CLIParams.prototype.validate = function () {
        var errMes = '';
        this.validated = true;
        var isSourceOk = this.convertIntoFiles('source');
        if (!isSourceOk) {
            errMes += 'Source Files Error; ';
        }
        var isTargetOK = this.mode === 'ALIGN' ? this.convertIntoFiles('target') : true;
        if (!isTargetOK) {
            errMes += 'Target Files Error; ';
        }
        if (this.mode === 'ALIGN' && this.sFiles.length !== this.tFiles.length) {
            errMes += 'ALIGN File Number Error; ';
        }
        if (this.mode === 'EXTRACT' && this.oFile.endsWith('.tsv')) {
            this.oFile = this.oFile.replace('.tsv', '.txt');
        }
        if (this.mode === 'ALIGN' && this.oFile.endsWith('.txt')) {
            this.oFile = this.oFile.replace('.txt', '.tsv');
        }
        return errMes;
    };
    CLIParams.prototype.convertIntoFiles = function (srcOrTgt) {
        var oooxml = ['.docx', '.xlsx', '.pptx'];
        var isWhich = srcOrTgt === 'source' ? this.source : this.target;
        var toWhich = srcOrTgt === 'source' ? this.sFiles : this.tFiles;
        var files = isWhich.split(',');
        for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
            var f = files_1[_i];
            try {
                var stat = fs_1.statSync(f);
                if (stat.isDirectory()) {
                    var dirName = f.replace('\\', '').endsWith('/') ? f : f + "/";
                    var clds = fs_1.readdirSync(f);
                    for (var _a = 0, clds_1 = clds; _a < clds_1.length; _a++) {
                        var cld = clds_1[_a];
                        if (oooxml.indexOf(cld.substr(-5, 5)) !== -1) {
                            toWhich.push("" + dirName + cld);
                        }
                    }
                }
                else {
                    if (oooxml.indexOf(f.substr(-5, 5)) !== -1) {
                        toWhich.push(f);
                    }
                }
            }
            catch (_b) {
                console.log(f + " does not exist");
                return false;
            }
        }
        if (toWhich.length === 0) {
            console.log('No Valid File');
            return false;
        }
        else {
            return true;
        }
    };
    return CLIParams;
}());
function inquirerDialog(sourceFiles) {
    console.log('CATOVIS Dialog Interface');
    var params = new CLIParams({});
    var inquirer = require('inquirer');
    var prompts = [
        {
            type: 'list',
            name: 'mode',
            message: 'Select Execution Mode.',
            choices: ['EXTRACT', 'ALIGN', 'COUNT', 'DIFF', 'TOVIS']
        },
        {
            name: 'source',
            message: 'Source input file(s)/folder(s) with comma separated. Remain blank for current directory',
            when: function () {
                return sourceFiles === undefined;
            }
        },
        {
            name: 'target',
            message: 'Target input file(s)/folder(s) with comma separated.',
            when: function (answerSoFar) {
                return answerSoFar.mode === 'ALIGN';
            }
        },
        {
            name: 'outputFile',
            message: function (answerSoFar) {
                var mes = 'Output file name. ';
                switch (answerSoFar.mode) {
                    case 'EXTRACT':
                        mes += 'Able to use ".txt"(implicit) or ".json", output to "console" if blank.';
                        break;
                    case 'ALIGN':
                        mes += 'Able to use ".tsv"(implicit) or ".json", output to "console" if blank.';
                        break;
                    case 'COUNT':
                        mes += 'Able to use ".tsv"(implicit), output to "console" if blank.';
                        break;
                    case 'DIFF':
                        mes += 'Able to use ".json"(implicit), output to "console" if blank.';
                        break;
                    case 'DIFF':
                        mes += 'Able to use ".tovis"(implicit), output to "console" if blank.';
                        break;
                    default:
                        break;
                }
                return mes;
            }
        },
        {
            name: 'exclusion',
            message: 'Input RegExp string for excluding from result.'
        },
        {
            type: 'checkbox',
            name: 'others',
            message: 'Designate other options(Multiple select with space bar).',
            choices: ['Dont add separation marks', 'Word-Before-Revision', 'PPT-Note', 'Excel-Hidden-Sheet', 'Excel-Filled-Cell', 'DEBUG']
        },
    ];
    inquirer.prompt(prompts).then(function (answer) {
        // cnm(answer)
        if (sourceFiles !== undefined) {
            answer.source = sourceFiles;
        }
        params.updateFromDialog(answer);
        params.executeByParams();
    });
}
// #起動時に処理される部分
console.log('------------------------');
var program = require('commander');
program
    .option('-c, --cmd', 'Use full CLI when true. Default value is "false"', false)
    .option('-m, --mode <item>', 'Select Execution Mode. Choose From "EXTRACT" | "ALIGN" | "COUNT" | "DIFF" | "TOVIS"')
    .option('-s, --source <item>', 'Source input file(s)/folder(s) with comma separated. You can input directly without option. Remain blank for current directory')
    .option('-t, --target <item>', 'Target input file(s)/folder(s) with comma separated.')
    .option('-i, --input <item>', 'A txt file which lists the input file. Currently not provided yet')
    .option('-o, --output <item>', 'Designate output file name with extension. Format can be selected from json, txt or tsv. Use standard output when blank')
    .option('-e, --exclusion <item>', 'RegExp string for excluding from result. The expression "^" and "$" will be automaticaly added.')
    .option('-w, --withSeparator', 'Use separation marks in out file. Default value is "true"', true)
    .option('--others <item>', 'Designate "Without-Separator(or wosep) | Word-Before-Rev(or norev) |PPT-Note(or note) | Excel-Hidden-Sheet(or hide) | Excel-Filled-Cell(or filled) | DEBUG". Multiple selection with comma.');
var args = program.parse(process.argv);
if (args.cmd === false) {
    if (args.args.length !== 0) {
        inquirerDialog(args.args[0]);
    }
    else {
        inquirerDialog();
    }
}
else {
    var params = new CLIParams(args);
    params.executeByParams();
}
