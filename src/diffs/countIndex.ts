// import { ReadingOption } from '#/util/option'
// import { OfficeExtractor } from '#/office/officeExtractor'
// import { DiffCalculator } from '#/diffs/diffCalc'
// import { CatDataContent } from '#/cat/cat'
// import { Tovis } from './tovis/tovis'

// import { useErrorMessage } from '#/util/util'
// import { largeModes, officeModes, countModes, catModes } from '#/util/params'
// import type { ModeLarge, ModeMiddleOffice, ModeMiddleCount, ModeMiddleCat } from '#/util/params'

export class CountWrapper {
  public moduleName = 'Count'

  public opt?: MyOption;

  constructor(opt?: MyOption, wwc?: WWCRate) {
    if (opt) {
      this.opt = opt
    }
  }

  public officeCalcSimple(files: OfficeContent[], unit: 'chara' | 'word', opt: MyOption): string[] {
    let totalSum = 0;
    const unitStr = unit === 'chara' ? '文字数' : '単語数';
    const result: string[] = [`ファイル名\t${unitStr}`, ''];
    // const spaces = new RegExp('\\s+', 'g');
    // const marks = new RegExp('(\\,|\\.|:|;|\\!|\\?|\\s)+', 'g');
    for (const file of files) {
      let sum = 0;
      for (const ext of file.exts) {
        if (!ext.isActive) {
          if (file.format === 'xlsx') {
            if (!opt.office.excel.readHiddenSheet) {
              continue
            }
          } else {
            continue;
          }
        }
        if (unit === 'chara') {
          sum += ext.sumCharas;
        } else if (unit === 'word') {
          sum += ext.sumWords;
        }
      }
      totalSum += sum;
      result.push(`${file.name}\t${sum}`);
    }
    result[1] = `総計\t${totalSum}`;
    return result;
  }

  public officeCalcSimpleOneFile(
    file: OfficeContent,
    unit: 'chara' | 'word',
    opt: MyOption, part?: SeparateMark): { subs: number[], sum: number, partial: number } {
    const partMark: SeparateMark = part || 'PPT-Note';
    const subs: number[] = [];
    let sum: number = 0
    let partial: number = 0
    for (const ext of file.exts) {
      if (!ext.isActive) {
        if (file.format === 'xlsx') {
          if (!opt.office.excel.readHiddenSheet) {
            subs.push(0);
            continue;
          }
        } else {
          subs.push(0);
          continue;
        }
      }
      const insum = unit === 'chara' ? ext.sumCharas : ext.sumWords;
      subs.push(insum);
      sum += insum
      if (ext.type === partMark) {
        partial += insum
      }
    }
    return { subs, sum, partial };
  }

  // public execOfficeOrCount(src: OfficeContent[], tgt: OfficeContent[]): Promise<string | string[]> {
  //   return new Promise<string | string[]>(async (resolve, reject) => {
  //     this.ext.setContent(src, tgt)
  //     switch (this.mid) {
  //       case 'CHARAS tsv':
  //         resolve(this.countCharasTsv())
  //         break;

  //       case 'WORDS tsv':
  //         resolve(this.countWordsTsv())
  //         break;

  //       case 'DIFF-CHARAS tsv':
  //         resolve(this.countDiffCharasTsv())
  //         break

  //       case 'DIFF-WORDS tsv': {
  //         resolve(this.countDiffWordsTsv())
  //         break
  //       }

  //       default:
  //         reject(false)
  //         break;
  //     }
  //   })
  // }
}