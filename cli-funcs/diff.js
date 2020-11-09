"use strict";
exports.__esModule = true;
exports.DiffInfo = void 0;
var DiffInfo = /** @class */ (function () {
    function DiffInfo() {
        var dsegs = [];
        this.dsegs = dsegs;
        var difflib = require('difflib');
        this.d = new difflib.SequenceMatcher(null, '', '');
        this.marks = new RegExp('(\\,|\\.|:|;|\\!|\\?|\\s)+', 'g');
        this.spaces = new RegExp('\\s+', 'g');
    }
    DiffInfo.prototype.analyze = function (cons, adding) {
        if (adding === undefined || adding === false) {
            this.dsegs.length = 0;
        }
        var i = 0;
        for (var _i = 0, cons_1 = cons; _i < cons_1.length; _i++) {
            var con = cons_1[_i];
            for (var _a = 0, _b = con.exts; _a < _b.length; _a++) {
                var text = _b[_a];
                if (!text.isActive) {
                    continue;
                }
                for (var _c = 0, _d = text.value; _c < _d.length; _c++) {
                    var val = _d[_c];
                    if (val === '') {
                        continue;
                    }
                    var sims = this.calcRatio(val);
                    var diff = {
                        pid: ++i,
                        file: con.name,
                        text: val,
                        len: val.replace(this.spaces, '').length,
                        sims: sims.sims,
                        max: sims.max,
                        maxp: sims.maxp
                    };
                    this.dsegs.push(diff);
                }
            }
        }
    };
    DiffInfo.prototype.calcWWC = function (unit, wordWeight) {
        if (this.dsegs.length === 0) {
            return;
        }
        var rate = wordWeight !== undefined ?
            wordWeight :
            {
                dupli: 1,
                over95: 1,
                over85: 1,
                over75: 1,
                over50: 1,
                under49: 1
            };
        var first = {
            name: this.dsegs[0].file,
            sum: 0,
            sum2: 0,
            dupli: 0,
            over95: 0,
            over85: 0,
            over75: 0,
            over50: 0,
            under49: 0
        };
        var files = [first];
        var report = {
            name: 'summary',
            base: rate,
            files: files,
            sum: 0,
            sum2: 0,
            dupli: 0,
            over95: 0,
            over85: 0,
            over75: 0,
            over50: 0,
            under49: 0
        };
        var i = 0;
        for (var _i = 0, _a = this.dsegs; _i < _a.length; _i++) {
            var dseg = _a[_i];
            if (dseg.file !== report.files[i].name) {
                report.sum += report.files[i].sum;
                report.sum2 += report.files[i].sum2;
                report.dupli += report.files[i].dupli;
                report.over95 += report.files[i].over95;
                report.over85 += report.files[i].over85;
                report.over75 += report.files[i].over75;
                report.over50 += report.files[i].over50;
                report.under49 += report.files[i].under49;
                i++;
                report.files.push({
                    name: dseg.file,
                    sum: 0,
                    sum2: 0,
                    dupli: 0,
                    over95: 0,
                    over85: 0,
                    over75: 0,
                    over50: 0,
                    under49: 0
                });
            }
            var len = void 0;
            if (unit === 'chara') {
                len = dseg.len;
            }
            else if (unit === 'word') {
                var wordText = dseg.text + '.';
                len = (dseg.text + ".").replace(/(\,|\.|:|;|\!|\?|\s)+/g, ' ').split(' ').length - 1;
            }
            else {
                len = 0;
            }
            report.files[i].sum += len;
            if (dseg.max < 50) {
                report.files[i].under49 += len;
                report.files[i].sum2 += Math.round(len * rate.under49 * 10) / 10;
            }
            else if (dseg.max < 75) {
                report.files[i].over50 += len;
                report.files[i].sum2 += Math.round(len * rate.over50 * 10) / 10;
            }
            else if (dseg.max < 85) {
                report.files[i].over75 += len;
                report.files[i].sum2 += Math.round(len * rate.over75 * 10) / 10;
            }
            else if (dseg.max < 95) {
                report.files[i].over85 += len;
                report.files[i].sum2 += Math.round(len * rate.over85 * 10) / 10;
            }
            else if (dseg.max < 100) {
                report.files[i].over95 += len;
                report.files[i].sum2 += Math.round(len * rate.over95 * 10) / 10;
            }
            else {
                report.files[i].dupli += len;
                report.files[i].sum2 += Math.round(len * rate.dupli * 10) / 10;
            }
        }
        report.sum += report.files[i].sum;
        report.sum2 += report.files[i].sum2;
        report.dupli += report.files[i].dupli;
        report.over95 += report.files[i].over95;
        report.over85 += report.files[i].over85;
        report.over75 += report.files[i].over75;
        report.over50 += report.files[i].over50;
        report.under49 += report.files[i].under49;
        this.report = report;
    };
    DiffInfo.prototype.exportResult = function (prop, format, wwc) {
        if (format === 'json') {
            switch (prop) {
                case 'diff':
                    return JSON.stringify(this.dsegs, null, ' ');
                case 'wwc-chara':
                case 'wwc-word':
                    if (this.report === undefined) {
                        var unit = prop === 'wwc-chara' ? 'chara' : 'word';
                        this.calcWWC(unit, wwc);
                        return JSON.stringify(this.report, null, ' ');
                    }
                    else {
                        return JSON.stringify(this.report, null, ' ');
                    }
                default:
                    return '';
            }
        }
        else if (format === 'human') {
            switch (prop) {
                case 'diff':
                    return 'under construction, please wait';
                case 'wwc-chara':
                case 'wwc-word':
                    var unit = prop === 'wwc-chara' ? 'chara' : 'word';
                    var unitHead = prop === 'wwc-chara' ? '文字' : '単語';
                    var line = ["\u30D5\u30A1\u30A4\u30EB\u540D\t" + unitHead + "\u6570\tWWC\u9069\u7528\u5F8C\t\u91CD\u8907\t95-99%\t85-94%\t75-84%\t50-74%\t0-49%"];
                    this.calcWWC(unit, wwc);
                    if (this.report !== undefined) {
                        line.push(this.report.name + '\t' +
                            this.report.sum + '\t' +
                            this.report.sum2 + '\t' +
                            this.report.dupli + '\t' +
                            this.report.over95 + '\t' +
                            this.report.over85 + '\t' +
                            this.report.over75 + '\t' +
                            this.report.over50 + '\t' +
                            this.report.under49);
                        for (var _i = 0, _a = this.report.files; _i < _a.length; _i++) {
                            var file = _a[_i];
                            line.push(file.name + '\t' +
                                file.sum + '\t' +
                                file.sum2 + '\t' +
                                file.dupli + '\t' +
                                file.over95 + '\t' +
                                file.over85 + '\t' +
                                file.over75 + '\t' +
                                file.over50 + '\t' +
                                file.under49);
                        }
                    }
                    return line.join('\n');
                default:
                    return '';
            }
        }
        else {
            return '';
        }
    };
    DiffInfo.prototype.calcRatio = function (st) {
        var uBound = 1.35;
        var lBound = 0.65;
        var ratioLimit = 51;
        var sims = [];
        this.d.setSeq1(st);
        var max = 0;
        var maxp = 0;
        for (var _i = 0, _a = this.dsegs; _i < _a.length; _i++) {
            var seg = _a[_i];
            var lenDistance = seg.len / st.length;
            if (lenDistance > uBound || lenDistance < lBound) {
                continue;
            }
            this.d.setSeq2(seg.text);
            var r = Math.floor(this.d.ratio() * 100);
            if (r > max) {
                max = r;
                maxp = seg.pid;
            }
            // 一致率が設定した下限より高い場合、類似文として登録する
            if (r > ratioLimit) {
                var sim = {
                    advPid: seg.pid,
                    text2: seg.text,
                    ratio: r,
                    opcode: this.d.getOpcodes()
                };
                sims.push(sim);
            }
        }
        // 一致率が高いものから降順に並び替え
        var simResult = sims.sort(function (a, b) {
            if (a.ratio < b.ratio) {
                return 1;
            }
            if (a.ratio > b.ratio) {
                return -1;
            }
            return 0;
        });
        return {
            sims: simResult,
            max: max,
            maxp: maxp
        };
    };
    return DiffInfo;
}());
exports.DiffInfo = DiffInfo;
