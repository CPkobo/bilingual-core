"use strict";
exports.__esModule = true;
exports.Tovis = void 0;
var fs_1 = require("fs");
var readline_1 = require("readline");
var diff_1 = require("./diff");
var extract_1 = require("./extract");
var plugins_1 = require("./plugins");
var Tovis = /** @class */ (function () {
    function Tovis() {
        this.meta = {
            srcLang: '',
            tgtLang: '',
            files: [],
            tags: [],
            groups: [],
            remarks: ''
        };
        this.blocks = [];
        this.plugins = new plugins_1.MyPlugins();
        var pwd = process.cwd();
        var plPaths = [];
        try {
            fs_1.statSync('./.tovisrc');
            var rcs = fs_1.readFileSync('./.tovisrc').toString();
            for (var _i = 0, _a = rcs.split('\n'); _i < _a.length; _i++) {
                var rc = _a[_i];
                if (!rc.startsWith('#')) {
                    plPaths.push(rc.trim().replace('<pwd>', pwd));
                }
            }
        }
        catch (e) {
            console.log('No .tovisrc file');
            console.log(e);
        }
        for (var _b = 0, plPaths_1 = plPaths; _b < plPaths_1.length; _b++) {
            var path = plPaths_1[_b];
            console.log(path);
            this.plugins.register(path);
        }
    }
    Tovis.prototype.parseFromFile = function (path, fileType) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            try {
                fs_1.statSync(path);
                if (fileType === 'tovis') {
                    _this.parseFromTovis(path).then(function (message) {
                        resolve({ isOk: true, message: message });
                    })["catch"](function (errMessage) {
                        reject({ isOk: false, message: errMessage });
                    });
                }
                else if (fileType === 'diff') {
                    var diffStr = fs_1.readFileSync(path).toString();
                    _this.parseDiffInfo(JSON.parse(diffStr)).then(function (message) {
                        resolve({ isOk: true, message: message });
                    })["catch"](function (errMessage) {
                        reject({ isOk: false, message: errMessage });
                    });
                }
                else if (fileType === 'plain') {
                    // const plainStr: string = readFileSync(path).toString()
                    _this.parseFromPlainText(path, true).then(function (message) {
                        resolve({ isOk: true, message: message });
                    })["catch"](function (errMessage) {
                        reject({ isOk: false, message: errMessage });
                    });
                }
                else {
                    reject({ isOk: false, message: 'fileType sholud designate from "tovis"/"diff"/"plain"' });
                }
            }
            catch (_a) {
                reject({ isOk: false, message: 'file did not found' });
            }
        });
    };
    Tovis.prototype.parseFromObj = function (data) {
        if (data instanceof extract_1.CatovisContext) {
            //
        }
        else if (data instanceof diff_1.DiffInfo) {
            this.parseDiffInfo(data.dsegs);
        }
    };
    Tovis.prototype.dump = function () {
        var tovisStr = [
            "#SourceLang: " + this.meta.srcLang,
            "#TargetLang: " + this.meta.tgtLang,
            "#IncludingFiles: " + this.meta.files.join(','),
            "#Tags: " + this.meta.tags.join(','),
        ];
        var groupsStr = [];
        for (var _i = 0, _a = this.meta.groups; _i < _a.length; _i++) {
            var group = _a[_i];
            groupsStr.push(group[0] + "-" + group[1]);
        }
        tovisStr.push("#Groups: " + groupsStr.join(','));
        if (this.meta.remarks !== '') {
            tovisStr.push("#Remarks: " + this.meta.remarks);
        }
        tovisStr.push('-----\n');
        for (var i = 0; i < this.blocks.length; i++) {
            tovisStr.push("@:" + (i + 1) + "} " + this.blocks[i].s);
            tovisStr.push("\u03BB:" + (i + 1) + "} " + this.blocks[i].t);
            if (this.blocks[i].m.length > 0) {
                for (var _b = 0, _c = this.blocks[i].m; _b < _c.length; _b++) {
                    var tmmt = _c[_b];
                    tovisStr.push("_:" + (i + 1) + "}[" + tmmt.type + "] " + tmmt.text);
                }
            }
            if (this.blocks[i].u.length > 0) {
                var used = [];
                for (var _d = 0, _e = this.blocks[i].u; _d < _e.length; _d++) {
                    var usedPair = _e[_d];
                    used.push(usedPair.s + "::" + usedPair.t.join('|'));
                }
                tovisStr.push("$:" + i + "} " + used.join(';'));
            }
            var refs = [];
            for (var _f = 0, _g = this.blocks[i].d; _f < _g.length; _f++) {
                var d = _g[_f];
                var ref = d.from + ">" + d.to + "|" + d.ratio;
                for (var _h = 0, _j = d.op; _h < _j.length; _h++) {
                    var op = _j[_h];
                    ref += "|" + op.join(',');
                }
                refs.push(ref);
            }
            tovisStr.push("^:" + (i + 1) + "} " + refs.join(';'));
            tovisStr.push("!:" + (i + 1) + "} " + this.blocks[i].c);
            tovisStr.push('');
        }
        return tovisStr;
    };
    Tovis.prototype.dumpToJson = function () {
        return JSON.stringify(this, null, 2);
    };
    Tovis.prototype.createBlock = function () {
        return {
            s: '',
            t: '',
            m: [],
            u: [],
            d: [],
            c: ''
        };
    };
    Tovis.prototype.createRef = function () {
        return {
            from: 0,
            to: 0,
            ratio: 0,
            op: []
        };
    };
    Tovis.prototype.createOpcodes = function (codes) {
        var opcodes = [];
        for (var _i = 0, codes_1 = codes; _i < codes_1.length; _i++) {
            var code = codes_1[_i];
            var eachChara = code.split(',');
            opcodes.push([
                eachChara[0],
                Number(eachChara[1]),
                Number(eachChara[2]),
                Number(eachChara[3]),
                Number(eachChara[4]),
            ]);
        }
        return opcodes;
    };
    Tovis.prototype.parseFromTovis = function (path) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var rs = fs_1.createReadStream(path);
            var lines = readline_1.createInterface(rs);
            var count = 1;
            var lineHead = new RegExp('^(@|λ|_|\\^|\\!)+:(\\d+)}\\s?');
            // const blocks: TovisBlock[] = []
            lines.on('line', function (line) {
                if (line.startsWith('#')) {
                    var metaData = line.split(':');
                    if (metaData.length > 1) {
                        switch (metaData[0]) {
                            case '#SourceLang':
                                _this.meta.srcLang = metaData[1].trim();
                                count++;
                                break;
                            case '#TargetLang':
                                _this.meta.tgtLang = metaData[1].trim();
                                count++;
                                break;
                            case '#IncludingFiles':
                                _this.meta.files = metaData[1].trim().split(',');
                                count++;
                                break;
                            case '#Tags':
                                _this.meta.tags = metaData[1].trim().split(',');
                                count++;
                                break;
                            case '#Groups':
                                var byGroups = metaData[1].trim().split(',');
                                for (var _i = 0, byGroups_1 = byGroups; _i < byGroups_1.length; _i++) {
                                    var byGroup = byGroups_1[_i];
                                    var fromAndTo = byGroup.split('-');
                                    if (fromAndTo.length >= 2) {
                                        _this.meta.groups.push([Number(fromAndTo[0]), Number(fromAndTo[1])]);
                                    }
                                }
                                count++;
                                break;
                            case '#Remarks':
                                _this.meta.remarks += metaData[1] + ";";
                                count++;
                            default:
                                break;
                        }
                    }
                    else {
                        _this.meta.remarks += line + ";";
                        count++;
                    }
                }
                else if (line !== '') {
                    var matchObj = line.match(lineHead);
                    if (matchObj !== null) {
                        var index = Number(matchObj[2]);
                        while (_this.blocks.length < index) {
                            _this.blocks.push(_this.createBlock());
                        }
                        _this.upsertBlocks(line.substr(0, 1), index, line.replace(lineHead, '').trim());
                        count++;
                    }
                }
            });
            lines.on('close', function () {
                resolve("success to read " + count + " rows");
            });
        });
    };
    Tovis.prototype.parseDiffInfo = function (diff) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var codeDict = {
                replace: '~',
                "delete": '-',
                insert: '+'
            };
            for (var _i = 0, diff_2 = diff; _i < diff_2.length; _i++) {
                var dseg = diff_2[_i];
                var block = _this.createBlock();
                // block.s = dseg.st;
                _this.setSource(block, dseg.st);
                block.t = dseg.tt;
                for (var _a = 0, _b = dseg.sims; _a < _b.length; _a++) {
                    var sim = _b[_a];
                    var refInfo = {
                        from: sim.advPid,
                        to: dseg.pid,
                        ratio: sim.ratio,
                        op: sim.opcode.filter(function (c) {
                            return c[0] !== 'equal';
                        }).map(function (c2) {
                            var mark = c2[0] === 'replace' ? '~' : c2[0] === 'delete' ? '-' : '+';
                            return [mark, c2[1], c2[2], c2[3], c2[4]];
                        })
                    };
                    block.d.push(refInfo);
                    _this.blocks[sim.advPid - 1].d.push(refInfo);
                }
                _this.blocks.push(block);
            }
            resolve('DiffInfo successfully parsed into TOVIS');
        });
    };
    Tovis.prototype.parseFromPlainText = function (path, withDiff) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var rs = fs_1.createReadStream(path);
            var lines = readline_1.createInterface(rs);
            var count = 1;
            var preCount = 1;
            var sepMarkA = '_@@_';
            var sepMarkB = '_@λ_';
            var isBiLang = path.endsWith('.tsv');
            var texts = [];
            lines.on('line', function (line) {
                if (line.startsWith(sepMarkA)) {
                    if (!line.endsWith('EOF')) {
                        var fileName = isBiLang ? line.split('\t')[0].replace(sepMarkA, '') : line.replace(sepMarkA, '');
                        _this.meta.files.push(fileName);
                    }
                }
                else if (line.startsWith(sepMarkB)) {
                    _this.meta.groups.push([preCount, count]);
                    preCount = count;
                }
                else if (line !== '') {
                    count++;
                    if (withDiff) {
                        texts.push(line);
                    }
                    else {
                        var block = _this.createBlock();
                        // block.s = isBiLang ? line.split('\t')[0] : line;
                        var st = isBiLang ? line.split('\t')[0] : line;
                        _this.setSource(block, st);
                        block.t = isBiLang ? line.split('\t')[1] : '';
                    }
                }
            });
            lines.on('close', function () {
                if (withDiff) {
                    var diff = new diff_1.DiffInfo();
                    diff.analyzeFromText(texts, isBiLang);
                    _this.parseDiffInfo(diff.dsegs).then(function () {
                        resolve("success to read " + count + " rows with Diff");
                    });
                }
                else {
                    resolve("success to read " + count + " rows");
                }
            });
        });
    };
    Tovis.prototype.upsertBlocks = function (keyChara, index, contents) {
        var isValid = false;
        switch (keyChara) {
            // 原文
            case '@': {
                if (contents !== '') {
                    if (this.blocks[index - 1].s === '') {
                        // this.blocks[index - 1].s = contents;
                        this.setSource(this.blocks[index - 1], contents);
                        isValid = true;
                    }
                }
                else {
                    isValid = true;
                }
                break;
            }
            // 確定訳文
            case 'λ': {
                if (contents !== '') {
                    if (this.blocks[index - 1].t === '') {
                        this.blocks[index - 1].t = contents;
                        isValid = true;
                    }
                }
                else {
                    isValid = true;
                }
                break;
            }
            // 訳文候補
            case '_': {
                if (contents !== '') {
                    var matchObj = contents.match(/^\[.+\]/);
                    if (matchObj === null) {
                        this.blocks[index - 1].m.push({ type: 'Hm?', text: contents });
                    }
                    else {
                        this.blocks[index - 1].m.push({
                            type: matchObj[0].replace('[', '').replace(']', ''),
                            text: contents.replace(matchObj[0], '')
                        });
                    }
                }
                isValid = true;
                break;
            }
            // 用語
            case '$': {
                if (contents !== '') {
                    var pairs = contents.split(';');
                    for (var _i = 0, pairs_1 = pairs; _i < pairs_1.length; _i++) {
                        var pair = pairs_1[_i];
                        var srcAndTgt = pair.split('::');
                        var used = {
                            s: srcAndTgt[0],
                            t: srcAndTgt[1].split('|')
                        };
                        this.blocks[index - 1].u.push(used);
                    }
                }
            }
            // コメント
            case '!': {
                if (contents !== '') {
                    this.blocks[index - 1].c += contents + ';';
                }
                isValid = true;
                break;
            }
            // 類似情報
            case '^': {
                if (contents !== '') {
                    if (this.blocks[index - 1].d.length === 0) {
                        var refs = [];
                        var singleCodes = contents.split(';');
                        for (var _a = 0, singleCodes_1 = singleCodes; _a < singleCodes_1.length; _a++) {
                            var singleCode = singleCodes_1[_a];
                            var elements = singleCode.split('|');
                            var fromAndTo = elements[0].split('>');
                            if (fromAndTo.length < 2) {
                                isValid = false;
                                break;
                            }
                            var ref = {
                                from: Number(fromAndTo[0]),
                                to: Number(fromAndTo[1]),
                                ratio: Number(elements[1]),
                                op: this.createOpcodes(elements.slice(2))
                            };
                            refs.push(ref);
                            // blocks[ref.from - 1].d.push(ref)
                        }
                        this.blocks[index - 1].d = refs;
                        isValid = true;
                    }
                }
                else {
                    isValid = true;
                }
                break;
            }
            default:
                break;
        }
        return isValid;
    };
    Tovis.prototype.setSource = function (block, text) {
        if (this.plugins.onSetSouce.length === 0) {
            block.s = text;
        }
        else {
            var processed = text;
            for (var _i = 0, _a = this.plugins.onSetSouce; _i < _a.length; _i++) {
                var plugin = _a[_i];
                processed = plugin.f(processed);
            }
            block.s = processed;
        }
    };
    Tovis.prototype.setMT = function (block, type, text) {
        if (this.plugins.onSetMT.length === 0) {
            block.m.push({ type: type, text: text });
        }
        else {
            var processed = text;
            for (var _i = 0, _a = this.plugins.onSetMT; _i < _a.length; _i++) {
                var plugin = _a[_i];
                processed = plugin.f(processed);
            }
            block.m.push({ type: type, text: processed });
        }
    };
    return Tovis;
}());
exports.Tovis = Tovis;
