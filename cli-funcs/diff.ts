import { ExtractedContent } from './extract';

export interface WWCRate {
  dupli: number;
  over95: number;
  over85: number;
  over75: number;
  over50: number;
  under49: number;
}

export interface WWCInfo extends WWCRate {
  name: string;
  sum: number;
  sum2: number;
}

export interface WWCReport extends WWCInfo {
  base: WWCRate;
  files: WWCInfo[];
}

export interface DiffSeg {
  pid: number;
  gid: number;
  file: string;
  st: string;
  tt: string;
  len: number;
  sims: SimilarSegment[];
  max: number;
  maxp: number;
}

export interface SimilarSegment {
  advPid: number;
  st2: string;
  ratio: number;
  opcode: Opcode[];
}

type Calcresult = {
  sims: SimilarSegment[],
  max: number,
  maxp: number,
};

// オペコードのタイプ。類似分の表示に使用
export type Opcode = [string, number, number, number, number];

export class DiffInfo {
  public dsegs: DiffSeg[];
  public d: any;
  public report: WWCReport | undefined;
  public marks: RegExp;
  public spaces: RegExp;

  constructor() {
    const dsegs: DiffSeg[] = [];
    this.dsegs = dsegs;
    const difflib = require('difflib');
    this.d = new difflib.SequenceMatcher(null, '', '');
    this.marks = new RegExp('(\\,|\\.|:|;|\\!|\\?|\\s)+', 'g');
    this.spaces = new RegExp('\\s+', 'g');
  }

  public analyze(cons: ExtractedContent[], adding?: boolean): void {
    if (adding === undefined || adding === false) {
      this.dsegs.length = 0;
    }
    let i = 0;
    let j = 0
    for (const con of cons) {
      j++
      for (const ext of con.exts) {
        if (!ext.isActive) {
          continue;
        }
        for (const val of ext.value) {
          if (val === '') {
            continue;
          }
          i++;
          this.addDseg(i, j, con.name, val, '');
          // const sims = this.calcRatio(val);
          // const diff: DiffSeg = {
          //   pid: ++i,
          //   file: con.name,
          //   st: val,
          //   tt: '',
          //   len: val.replace(this.spaces, '').length,
          //   sims: sims.sims,
          //   max: sims.max,
          //   maxp: sims.maxp,
          // };
          // this.dsegs.push(diff);
        }
      }
    }
  }

  public analyzeFromText(texts: string[], biLang: boolean, adding?: boolean): void {
    if (adding === undefined || adding === false) {
      this.dsegs.length = 0;
    }
    let i = 0;
    let j = 0;
    for (const text of texts) {
      const st = biLang ? text.split(`\t`)[0] : text;
      const tt = biLang ? text.split(`\t`)[1] : '';
      if (st.startsWith('_@')) {
        j++
      }
      i++;
      this.addDseg(i, j, '', st, tt);
    }
  }

  public calcWWC(unit: 'word' | 'chara', wordWeight?: WWCRate): void {
    if (this.dsegs.length === 0) {
      return;
    }
    const rate: WWCRate = wordWeight !== undefined ?
      wordWeight :
      {
        dupli: 1,
        over95: 1,
        over85: 1,
        over75: 1,
        over50: 1,
        under49: 1,
      };

    const first: WWCInfo = {
      name: this.dsegs[0].file,
      sum: 0,
      sum2: 0,
      dupli: 0,
      over95: 0,
      over85: 0,
      over75: 0,
      over50: 0,
      under49: 0,
    };
    const files: WWCInfo[] = [first];
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
    let i = 0;
    for (const dseg of this.dsegs) {
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
          under49: 0,
        });
      }

      let len: number;

      if (unit === 'chara') {
        len = dseg.len;
      } else if (unit === 'word') {
        const wordText = dseg.st + '.';
        len = `${dseg.st}.`.replace(/(\,|\.|:|;|\!|\?|\s)+/g, ' ').split(' ').length - 1;
      } else {
        len = 0;
      }

      report.files[i].sum += len;

      if (dseg.max < 50) {
        report.files[i].under49 += len;
        report.files[i].sum2 += Math.round(len * rate.under49 * 10) / 10;
      } else if (dseg.max < 75) {
        report.files[i].over50 += len;
        report.files[i].sum2 += Math.round(len * rate.over50 * 10) / 10;
      } else if (dseg.max < 85) {
        report.files[i].over75 += len;
        report.files[i].sum2 += Math.round(len * rate.over75 * 10) / 10;
      } else if (dseg.max < 95) {
        report.files[i].over85 += len;
        report.files[i].sum2 += Math.round(len * rate.over85 * 10) / 10;
      } else if (dseg.max < 100) {
        report.files[i].over95 += len;
        report.files[i].sum2 += Math.round(len * rate.over95 * 10) / 10;
      } else {
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
        case 'wwc-word':
          const unit = prop === 'wwc-chara' ? 'chara' : 'word';
          const unitHead = prop === 'wwc-chara' ? '文字' : '単語';
          const line: string[] = [`ファイル名\t${unitHead}数\tWWC適用後\t重複\t95-99%\t85-94%\t75-84%\t50-74%\t0-49%`];
          this.calcWWC(unit, wwc);

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

        default:
          return '';
      }
    } else {
      return '';
    }
  }

  private addDseg(pid: number, gid: number, file: string, st: string, tt: string) {
    const sims = this.calcRatio(st);
    const diff: DiffSeg = {
      pid,
      gid,
      file,
      st,
      tt,
      len: st.replace(this.spaces, '').length,
      sims: sims.sims,
      max: sims.max,
      maxp: sims.maxp,
    };
    this.dsegs.push(diff);
  }

  private calcRatio(st: string): Calcresult {
    const uBound = 1.35;
    const lBound = 0.65;
    const ratioLimit = 51;
    const sims: SimilarSegment[] = [];
    this.d.setSeq1(st);
    let max = 0;
    let maxp = 0;

    for (const seg of this.dsegs) {
      const lenDistance = seg.len / st.length;
      if (lenDistance > uBound || lenDistance < lBound) {
        continue;
      }
      this.d.setSeq2(seg.st);
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
