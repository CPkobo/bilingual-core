import { CountWrapper } from './countIndex'
import { SequenceMatcher } from '../../difflib/src/sequenceMatcher'
import { countCharas, countWords } from '../util/util';


export class DiffCalculator {
  public dsegs: DiffSeg[];
  public files: string[];
  public d: SequenceMatcher;
  public report: WWCReport | undefined;
  public marks: RegExp;
  public spaces: RegExp;
  private counter: CountWrapper
  protected isDigit: RegExp;

  constructor() {
    const dsegs: DiffSeg[] = [];
    this.dsegs = dsegs;
    this.files = [];
    // const difflib = require('difflib');
    // this.d = new difflib.SequenceMatcher(null, '', '');
    this.d = new SequenceMatcher();
    this.d.setDefaultDirection('B2A')
    this.marks = new RegExp('(\\,|\\.|:|;|\\!|\\?|\\s)+', 'g');
    this.spaces = new RegExp('\\s+', 'g');
    this.isDigit = new RegExp('^[\\d\\. ]+$');
    this.counter = new CountWrapper()
  }

  public setOptions(opt: MyOption | undefined | null): boolean {
    if (opt === undefined || opt === null) {
      return false
    } else {
      this.counter.opt = opt
      return true
    }
  }

  public readFromJson(data: string): void {
    const jdata = JSON.parse(data)
    if (jdata.dsegs !== undefined) {
      this.dsegs = jdata.dsegs
    }
    if (jdata.files !== undefined) {
      this.files = jdata.files
    }
  }

  public dumpToJson(): string {
    const data = {
      dsegs: this.dsegs,
      files: this.files
    }
    return JSON.stringify(data, null, 2)
  }

  // counter のラップ
  public officeCalcSimple(files: OfficeContent[], unit: 'chara' | 'word', opt: MyOption): string[] {
    return this.counter.officeCalcSimple(files, unit, opt)
  }

  public officeCalcSimpleOneFile(
    file: OfficeContent,
    unit: 'chara' | 'word',
    opt: MyOption, part?: SeparateMark): { subs: number[], sum: number, partial: number } {
    return this.counter.officeCalcSimpleOneFile(file, unit, opt, part)
  }

  public exportDiffText(text1: string, text2: string): string {
    this.d.setSeqs(text1, text2)
    return this.d.applyOpcodes()
  }

  public analyze(cons: OfficeContent[], adding?: boolean): void {
    if (adding === undefined || adding === false) {
      this.dsegs.length = 0;
    }
    let pid = -1;
    let gid = -1;
    let fid = -1
    for (const con of cons) {
      fid++
      this.files.push(con.name)
      for (const ext of con.exts) {
        if (!ext.isActive) {
          continue;
        }
        gid++
        for (const val of ext.value) {
          if (val === '') {
            continue;
          }
          pid++;
          this.addDseg(pid, gid, fid, val, '');
        }
      }
    }
  }

  public analyzeFromText(text: string, adding: boolean = false): void {
    if (!adding) {
      this.dsegs.length = 0;
    }
    const sepMarkA = '_@@_';
    const sepMarkB = '_@λ_';
    let fileName = ''
    const lines: string[] = text.split('\n')
    let pid = -1
    let gid = -1
    let fid = -1
    lines.forEach(line => {
      const blt = line.split('\t')
      const st = blt[0]
      const tt = blt.length >= 2 ? blt[1] : ''
      if (st.startsWith(sepMarkA)) {
        if (!line.endsWith('EOF')) {
          // fileName = st.replace(sepMarkA, '')
          fid++
          this.files.push(st.replace(sepMarkA, ''))
        }
      } else if (line.startsWith(sepMarkB)) {
        gid++
      } else if (line !== '') {
        pid++;
        this.addDseg(pid, gid, fid, st, tt);
      }
    });
  }

  public calcWWC(unit: 'word' | 'chara', wordWeight?: WWCRate): void {
    if (this.dsegs.length === 0) {
      return;
    }
    const rate: WWCRate = wordWeight !== undefined ? wordWeight :
      {
        dupli: 1,
        over95: 1,
        over85: 1,
        over75: 1,
        over50: 1,
        under49: 1,
      };

    // 結果を格納するオブジェクト report の準備
    // 1つ目のファイルのレポートは別途準備しておく
    const files: WWCInfo[] = [
      {
        name: this.files[0] || '',
        sum: 0,
        sum2: 0,
        dupli: 0,
        over95: 0,
        over85: 0,
        over75: 0,
        over50: 0,
        under49: 0,
      }
    ];
    const report: WWCReport = {
      name: 'summary',
      base: rate,
      files,
      sum: 0,
      sum2: 0,
      dupli: 0,
      over95: 0,
      over85: 0,
      over75: 0,
      over50: 0,
      under49: 0,
    };
    let crt = 0;
    for (const dseg of this.dsegs) {
      // ファイル名が変わった場合に行う処理
      if (dseg.fid !== crt) {
        // 課金率適用後の文字数を計算
        report.files[crt].sum2 +=
          Math.round(report.files[crt].under49 * rate.under49 * 10) / 10 +
          Math.round(report.files[crt].over50 * rate.over50 * 10) / 10 +
          Math.round(report.files[crt].over75 * rate.over75 * 10) / 10 +
          Math.round(report.files[crt].over85 * rate.over85 * 10) / 10 +
          Math.round(report.files[crt].over95 * rate.over95 * 10) / 10 +
          Math.round(report.files[crt].dupli * rate.dupli * 10) / 10;

        // Summary に一つ前のファイルの文字数を加算しておく
        report.sum += report.files[crt].sum;
        report.sum2 += report.files[crt].sum2;
        report.dupli += report.files[crt].dupli;
        report.over95 += report.files[crt].over95;
        report.over85 += report.files[crt].over85;
        report.over75 += report.files[crt].over75;
        report.over50 += report.files[crt].over50;
        report.under49 += report.files[crt].under49;

        // ファイルの参照を進める
        crt++;
        report.files.push({
          name: this.files[crt] || '',
          sum: 0,
          sum2: 0,
          dupli: 0,
          over95: 0,
          over85: 0,
          over75: 0,
          over50: 0,
          under49: 0,
        });
      }

      const len: number = unit === 'chara' ? countCharas(dseg.st) : countWords(dseg.st);

      report.files[crt].sum += len;

      // 一致率に応じて文字数を振り分けておく
      if (dseg.max < 50) {
        report.files[crt].under49 += len;
        // report.files[i].sum2 += Math.round(len * rate.under49 * 10) / 10;
      } else if (dseg.max < 75) {
        report.files[crt].over50 += len;
        // report.files[i].sum2 += Math.round(len * rate.over50 * 10) / 10;
      } else if (dseg.max < 85) {
        report.files[crt].over75 += len;
        // report.files[i].sum2 += Math.round(len * rate.over75 * 10) / 10;
      } else if (dseg.max < 95) {
        report.files[crt].over85 += len;
        // report.files[i].sum2 += Math.round(len * rate.over85 * 10) / 10;
      } else if (dseg.max < 100) {
        report.files[crt].over95 += len;
        // report.files[i].sum2 += Math.round(len * rate.over95 * 10) / 10;
      } else {
        report.files[crt].dupli += len;
        // report.files[i].sum2 += Math.round(len * rate.dupli * 10) / 10;
      }
    }
    // 課金率適用後の文字数を計算
    report.files[crt].sum2 +=
      Math.round(report.files[crt].under49 * rate.under49 * 10) / 10 +
      Math.round(report.files[crt].over50 * rate.over50 * 10) / 10 +
      Math.round(report.files[crt].over75 * rate.over75 * 10) / 10 +
      Math.round(report.files[crt].over85 * rate.over85 * 10) / 10 +
      Math.round(report.files[crt].over95 * rate.over95 * 10) / 10 +
      Math.round(report.files[crt].dupli * rate.dupli * 10) / 10;

    // Summary に一つ前のファイルの文字数を加算しておく
    report.sum += report.files[crt].sum;
    report.sum2 += report.files[crt].sum2;
    report.dupli += report.files[crt].dupli;
    report.over95 += report.files[crt].over95;
    report.over85 += report.files[crt].over85;
    report.over75 += report.files[crt].over75;
    report.over50 += report.files[crt].over50;
    report.under49 += report.files[crt].under49;

    this.report = report;
  }

  public exportResult(prop: 'diff' | 'wwc-word' | 'wwc-chara', format: 'json' | 'human', wwc?: WWCRate): string {
    if (format === 'json') {
      switch (prop) {
        case 'diff':
          return JSON.stringify(this.dsegs, null, ' ');

        case 'wwc-chara':
        case 'wwc-word':
          if (this.report === undefined) {
            const unit = prop === 'wwc-chara' ? 'chara' : 'word';
            this.calcWWC(unit, wwc);
            return JSON.stringify(this.report, null, ' ');
          } else {
            return JSON.stringify(this.report, null, ' ');
          }

        default:
          return '';
      }
    } else if (format === 'human') {
      switch (prop) {
        case 'diff':
          return 'under construction, please wait';

        case 'wwc-chara':
        case 'wwc-word': {
          const unit = prop === 'wwc-chara' ? 'chara' : 'word';
          const unitHead = prop === 'wwc-chara' ? '文字' : '単語';
          const line: string[] = [`ファイル名\t${unitHead}数\tWWC適用後\t重複\t95-99%\t85-94%\t75-84%\t50-74%\t0-49%`];
          if (this.report === undefined) {
            this.calcWWC(unit, wwc);
          }
          if (this.report !== undefined) {
            line.push(
              this.report.name + '\t' +
              this.report.sum + '\t' +
              this.report.sum2 + '\t' +
              this.report.dupli + '\t' +
              this.report.over95 + '\t' +
              this.report.over85 + '\t' +
              this.report.over75 + '\t' +
              this.report.over50 + '\t' +
              this.report.under49,
            );
            for (const file of this.report.files) {
              line.push(
                file.name + '\t' +
                file.sum + '\t' +
                file.sum2 + '\t' +
                file.dupli + '\t' +
                file.over95 + '\t' +
                file.over85 + '\t' +
                file.over75 + '\t' +
                file.over50 + '\t' +
                file.under49,
              );
            }
          }
          return line.join('\n');
        }

        default:
          return '';
      }
    } else {
      return '';
    }
  }

  protected addDseg(pid: number, gid: number, fid: number, st: string, tt: string) {
    if (this.isDigit.test(st)) {
      this.dsegs.push({
        pid,
        gid,
        fid,
        st,
        tt,
        len: st.length,
        sims: [],
        max: -1,
        maxp: -1,
      });
    } else {
      const sims = this.calcRatio(st);
      const diff: DiffSeg = {
        pid,
        gid,
        fid,
        st,
        tt,
        len: countCharas(st),
        sims: sims.sims,
        max: sims.max,
        maxp: sims.maxp,
      };
      this.dsegs.push(diff);
    }
  }

  protected calcRatio(st: string): Calcresult {
    const uBound = 1.35;
    const lBound = 0.65;
    const ratioLimit = 51;
    const sims: SimilarSegment[] = [];
    // this.d.setSeq1(st);
    // seq2 の方が計算量が多いため、こちらに新しい原文をセットすることで計算量を減らす
    this.d.setSeq2(st);
    let max = 0;
    let maxp = 0;
    const upperLen = st.length * uBound;
    const lowerLen = st.length * lBound;

    for (const seg of this.dsegs) {
      // 割り算を減らして高速化
      if (upperLen < seg.len || lowerLen > seg.len) {
        continue;
      }
      this.d.setSeq1(seg.st);
      const r = Math.floor(this.d.ratio() * 100);
      if (r > max) {
        max = r;
        maxp = seg.pid;
      }
      // 一致率が設定した下限より高い場合、類似文として登録する
      if (r > ratioLimit) {
        const sim: SimilarSegment = {
          advPid: seg.pid,
          st2: seg.st,
          ratio: r,
          opcode: this.d.getOpcodes(),
        };
        sims.push(sim);
      }
    }
    // 一致率が高いものから降順に並び替え
    const simResult: SimilarSegment[] = sims.sort((a, b) => {
      if (a.ratio < b.ratio) { return 1; }
      if (a.ratio > b.ratio) { return -1; }
      return 0;
    });
    return {
      sims: simResult,
      max,
      maxp,
    };
  }
}
