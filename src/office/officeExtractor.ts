/* tslint:disable:max-line-length */
/* tslint:disable:max-classes-per-file */
/* tslint:disable:no-shadowed-variable */
/* tslint:disable:prefer-for-of */


// cliフォルダでtscするときはrequireを使う
// import JSZip from 'jszip'
const JSZip = require('jszip');

import { ReadingOption } from '../util/option';
import { MyOfficeFileStats } from '../office/stats';
import { cnm } from '../util/util';

export class OfficeExtractor {
  private src: OfficeContent[];
  private tgt: OfficeContent[];

  constructor() {
    this.src = [];
    this.tgt = [];
  }

  public setContent(src: OfficeContent[], tgt?: OfficeContent[]): void {
    this.src.push(...src);
    if (tgt !== undefined) {
      this.tgt.push(...tgt);
    }
  }

  // public resetContent(): void {
  //   this.src.length = 0
  //   this.tgt.length = 0
  // }

  public readFromJSON(target: 'src' | 'tgt' | 'both', jsonStr: string): void {
    switch (target) {
      case 'src':
        this.src = JSON.parse(jsonStr);
        this.tgt = [];
        break;

      case 'tgt':
        this.src = [];
        this.tgt = JSON.parse(jsonStr);
        break;

      case 'both': {
        const data: any = JSON.parse(jsonStr);
        const hasSrc = data.src !== undefined
        const hasTgt = data.tgt !== undefined
        // メンバーにsrcもtgtもいなかった場合、srcのデータとして扱う
        if (!hasSrc && !hasTgt) {
          this.src.push(...data)
        } else {
          if (hasSrc) {
            this.src.push(...data.src)
          }
          if (hasTgt) {
            this.tgt.push(...data.tgt)
          }
        }
        break;
      }

      default:
        break;
    }
  }

  public changeActives(target: 'src' | 'tgt', index: number, actives: boolean[]): void {
    const toChange: OfficeContent[] = target === 'src' ? this.src : this.tgt;
    if (toChange.length === 0) {
      return;
    } else if (actives.length !== toChange[index].exts.length) {
      return;
    }

    for (let i = 0; i < actives.length; i++) {
      toChange[index].exts[i].isActive = actives[i];
    }
  }

  public changeFilePriority(target: 'src' | 'tgt' | 'both', fx: number, move: -1 | 1): void {
    const toChange: OfficeContent[] = target === 'src' ? this.src : this.tgt;
    if (toChange.length === 0) {
      return;
    }
    const tempCon: OfficeContent = toChange.splice(fx, 1)[0];
    toChange.splice(fx + move, 0, tempCon);
  }

  public getContentsLength(target: 'src' | 'tgt' | 'longer' | 'shorter'): number {
    const srclen = this.src.length;
    const tgtlen = this.tgt.length
    switch (target) {
      case 'src':
        return srclen;

      case 'tgt':
        return tgtlen;

      case 'longer':
        return srclen >= tgtlen ? srclen : tgtlen;

      case 'shorter':
        return srclen <= tgtlen ? srclen : tgtlen;

      default:
        return 0;
    }
  }

  public getRawContent(target: 'src' | 'tgt'): OfficeContent[] {
    if (target === 'src') {
      return this.src;
    } else {
      return this.tgt;
    }
  }

  public dumpToJson(target: 'src' | 'tgt' | 'both'): string {
    const data = {
      src: this.src,
      tgt: this.tgt,
    }
    if (target === 'both') {
      return JSON.stringify(data, null, 2)
    } else if (target === 'src') {
      return JSON.stringify(data.src, null, 2)
    } else {
      return JSON.stringify(data.tgt, null, 2)
    }
  }

  public getSimplifiedText(from: 'src' | 'tgt'): string[][] {
    const target: OfficeContent[] = from === 'src' ? this.src : this.tgt;
    const results: string[][] = []
    for (const file of target) {
      const result: string[] = [file.name]
      for (const text of file.exts) {
        if (text.isActive) {
          result.push(...text.value)
        }
      }
      results.push(result)
    }
    return results
  }

  public getSingleText(from: 'src' | 'tgt', opt: MyOption): string[] {
    // let target: OfficeContent[] = [];
    // if (from === 'src') {
    //   if (this.src === null) {
    //     return [];
    //   } else {
    //     target = this.src;
    //   }
    // }
    // if (from === 'tgt') {
    //   if (this.tgt === null) {
    //     return [];
    //   } else {
    //     target = this.tgt;
    //   }
    // }
    const target: OfficeContent[] = from === 'src' ? this.src : this.tgt;
    const result: string[] = [];
    for (const file of target) {
      if (opt.common.withSeparator) {
        result.push(file.name);
      }
      for (const text of file.exts) {
        if (!text.isActive) {
          if (file.format === 'xlsx') {
            if (!opt.office.excel.readHiddenSheet) {
              continue
            }
          } else {
            continue;
          }
        }
        if (opt.common.withSeparator) {
          let mark = '';
          switch (text.type) {
            case 'Word-Paragraph':
              mark = '_@λ_ PARAGRAPH _λ@_';
              break;

            case 'Word-Table':
              mark = '_@λ_ TABLE _λ@_';
              break;

            case 'Excel-Sheet':
              mark = `_@λ_ SHEET${text.position} _λ@_`;
              break;

            case 'Excel-Shape':
              mark = `_@λ_ SHEET${text.position} shape _λ@_`;
              break;

            case 'PPT-Slide':
              mark = `_@λ_ SLIDE${text.position} _λ@_`;
              break;

            case 'PPT-Diagram':
              mark = `_@λ_ SLIDE${text.position} diagram _λ@_`;
              break;

            case 'PPT-Chart':
              mark = `_@λ_ SLIDE${text.position} chart _λ@_`;
              break;

            case 'PPT-Note':
              mark = `_@λ_ SLIDE${text.position} note _λ@_`;
              break;

            default:
              break;
          }
          result.push(mark);
        }
        result.push(...text.value);
      }
    }
    return result
  };

  public getAlignedText(opt: MyOption): string[] {
    if (this.src === null) {
      return []
    } else if (this.tgt === null) {
      return []
    } else {
      const len = this.src.length;
      const aligned: string[] = [];
      let toSep = false;
      if (opt.common.withSeparator !== undefined) {
        toSep = opt.common.withSeparator
      }
      for (let i = 0; i < len; i++) {
        const sf = this.src[i];
        const tf = this.tgt[i];
        const inFile: string[] = [];
        if (toSep) {
          inFile.push(`_@@_ ${sf.name}\t_@@_ ${tf.name}`);
        }
        const type = sf.format;
        switch (type) {
          case 'docx': {
            const spfs: ExtractedText[] = [];
            const stfs: ExtractedText[] = [];
            for (const et of sf.exts) {
              if (et.type === 'Word-Paragraph') {
                spfs.push(et);
              } else if (et.type === 'Word-Table') {
                stfs.push(et);
              }
            }

            const tpfs: ExtractedText[] = [];
            const ttfs: ExtractedText[] = [];
            for (const et of tf.exts) {
              if (et.type === 'Word-Paragraph') {
                tpfs.push(et);
              } else if (et.type === 'Word-Table') {
                ttfs.push(et);
              }
            }

            const spfNum = spfs.length;
            const tpfNum = tpfs.length;
            const plarger = spfNum >= tpfNum ? spfNum : tpfNum;
            for (let j = 0; j < plarger; j++) {
              const sv = spfs[j] !== undefined ? spfs[j].value.slice() : [''];
              const tv = tpfs[j] !== undefined ? tpfs[j].value.slice() : [''];
              inFile.push(...this.segPairing(sv, tv, 'PARAGRAPH', toSep));
            }

            const stfNum = stfs.length;
            const ttfNum = ttfs.length;
            const tlarger = stfNum >= ttfNum ? stfNum : ttfNum;
            for (let k = 0; k < tlarger; k++) {
              const sv = stfs[k] !== undefined ? stfs[k].value.slice() : [''];
              const tv = ttfs[k] !== undefined ? ttfs[k].value.slice() : [''];
              inFile.push(...this.segPairing(sv, tv, 'TABLE', toSep));
            }
            inFile.push('_@@_ EOF\t_@@_ EOF');
            aligned.push(...inFile);
            break;
          }

          case 'xlsx': {
            const sfNum = sf.exts.length;
            const tfNum = tf.exts.length;
            const larger = sfNum >= tfNum ? sfNum : tfNum;
            let k = 0;
            for (let j = 0; j <= larger - 1; j++) {
              k++;
              const sv = sf.exts[j] !== undefined ? sf.exts[j].value.slice() : [''];
              const tv = tf.exts[j] !== undefined ? tf.exts[j].value.slice() : [''];
              inFile.push(...this.segPairing(sv, tv, `SHEET${k}`, toSep));
              if (sf.exts[j + 1] !== undefined && tf.exts[j + 1] !== undefined) {
                if (sf.exts[j + 1].type === 'Excel-Shape' || tf.exts[j + 1].type === 'Excel-Shape') {
                  const sv = sf.exts[j + 1].type === 'Excel-Shape' ? sf.exts[j + 1].value.slice() : [''];
                  const tv = tf.exts[j + 1].type === 'Excel-Shape' ? tf.exts[j + 1].value.slice() : [''];
                  inFile.push(...this.segPairing(sv, tv, `SHEET${k}-shape`, toSep));
                  j++;
                }
              }
            }
            inFile.push('_@@_ EOF\t_@@_ EOF');
            aligned.push(...inFile);
            break;
          }

          case 'pptx': {
            const sfNum = sf.exts.length;
            const tfNum = tf.exts.length;
            const larger = sfNum >= tfNum ? sfNum : tfNum;
            let k = 0;
            for (let j = 0; j <= larger - 1; j++) {
              k++;
              const sv = sf.exts[j] !== undefined ? sf.exts[j].value.slice() : [''];
              const tv = tf.exts[j] !== undefined ? tf.exts[j].value.slice() : [''];
              inFile.push(...this.segPairing(sv, tv, `SLIDE${k}`, toSep));
              if (sf.exts[j + 1] !== undefined && tf.exts[j + 1] !== undefined) {
                if (sf.exts[j + 1].type === 'PPT-Note' || tf.exts[j + 1].type === 'PPT-Note') {
                  const sv = sf.exts[j + 1].type === 'PPT-Note' ? sf.exts[j + 1].value.slice() : [''];
                  const tv = tf.exts[j + 1].type === 'PPT-Note' ? tf.exts[j + 1].value.slice() : [''];
                  inFile.push(...this.segPairing(sv, tv, `SLIDE${k}-note`, toSep));
                  j++;
                }
              }
            }
            inFile.push('_@@_ EOF\t_@@_ EOF');
            aligned.push(...inFile);
            break;
          }

          default: {
            break;
          }
        }
      }
      return aligned;
    };
  }

  public getAlignStats(): MyOfficeFileStats[][] {
    const statsList: MyOfficeFileStats[][] = [];
    if (this.src !== null && this.tgt !== null) {
      for (let i = 0; i < this.src.length; i++) {
        const srcStats = new MyOfficeFileStats(this.src[i].name, this.src[i].format);
        const tgtStats = new MyOfficeFileStats(this.tgt[i].name, this.tgt[i].format);
        for (const ext of this.src[i].exts) {
          srcStats.countElement(ext);
        }
        for (const ext of this.tgt[i].exts) {
          tgtStats.countElement(ext);
        }
        statsList.push([srcStats, tgtStats]);
      }
    }
    return statsList;
  }

  private segPairing(sVal: string[], tVal: string[], mark: string, separation: boolean): string[] {
    const inSection: string[] = [];
    if (separation) {
      inSection.push(`_@λ_ ${mark} _λ@_\t_@λ_ ${mark} _λ@_`);
    }
    const sLen = sVal.length;
    const tLen = tVal.length;
    const larger = sLen >= tLen ? sLen : tLen;
    if (sLen > tLen) {
      const diff = sLen - tLen;
      for (let i = 0; i < diff; i++) {
        tVal.push('');
      }
    } else if (sLen < tLen) {
      const diff = tLen - sLen;
      for (let i = 0; i < diff; i++) {
        sVal.push('');
      }
    }
    for (let i = 0; i < larger; i++) {
      if (!(sVal[i] === '' && tVal[i] === '')) {
        inSection.push(`${sVal[i].replace(/\n|\r/g, '')}\t${tVal[i].replace(/\n|\r/g, '')}`);
      }
    }
    return inSection;
  }
}
