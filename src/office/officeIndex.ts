import { OfficeExtractor } from '../office/officeExtractor'
import { useErrorMessage } from '../util/util'
// import type { ModeMiddleOffice } from '../util/params'
import { docxReader } from './docxReader'
import { xlsxReader } from './xlsxReader'
import { pptxReader } from './pptxReader'
import { pdfReader } from './pdfRead'

export class OfficeExtractWrapper {
  public moduleName = 'Office'
  // public mid: ModeMiddleOffice | ''

  public opt?: MyOption;
  private ext: OfficeExtractor;
  // public diff?: DiffCalculator;
  // public wwc: WWCRate
  // public recomendFormat: string

  constructor() {
    // this.mid = ''
    // this.opt = new ReadingOption()
    this.ext = new OfficeExtractor()
    // this.diff = new DiffCalculator()
    // this.wwc = {
    //   dupli: 1,
    //   over95: 1,
    //   over85: 1,
    //   over75: 1,
    //   over50: 1,
    //   under49: 1,
    // }
    // this.recomendFormat = '.txt'
  }

  // public readOption(opq: MyOption) {
  //   this.opt = opq
  // }

  // ModeMiddleを設定する
  // public setModeMiddle(middle: string | undefined | null, recomendFormat?: string): ErrorMessage {
  //   // this.recomendFormat = recomendFormat !== undefined ? recomendFormat
  //   //   : middle === undefined || middle === null ? this.recomendFormat
  //   //     : middle.substring(middle.lastIndexOf(' ') + 1)
  //   if (middle === undefined || middle === null || middle === '') {
  //     return useErrorMessage(
  //       { isErr: true, code: this.moduleName + '1', name: 'Mode Select', message: 'This is not valid mode' }
  //     )
  //   } else {
  //     for (const modemd of officeModes) {
  //       if (middle === modemd) {
  //         this.mid = middle as ModeMiddleOffice
  //         return useErrorMessage({})
  //       }
  //     }
  //   }
  //   return useErrorMessage(
  //     { isErr: true, code: this.moduleName + '2', name: 'Mode Select', message: 'This is not valid mode' }
  //   )
  // }

  public setOptions(opq: MyOption | undefined | null): boolean {
    if (opq === undefined || opq === null) {
      return false
    } else {
      this.opt = opq
      return true
    }
  }



  public extractAsSimpleExtractor(): SimpleContent {
    const src: string[][] = this.ext.getSimplifiedText('src')
    const tgt: string[][] = this.ext.getSimplifiedText('tgt')
    return { src, tgt }
  }

  public async setExtract(src: ReadData[], tgt: ReadData[], opt?: MyOption): Promise<{ src: OfficeContent[], tgt: OfficeContent[] }> {
    if (opt) {
      this.setOptions(opt)
    }
    return new Promise(async (resolve, reject) => {
      const srcData = await this.buffer2Extract(src, true)
      const tgtData = tgt.length === 0 ? undefined : await this.buffer2Extract(tgt, false)
      this.ext.setContent(srcData, tgtData)
      resolve({ src: srcData, tgt: tgtData || [] })
    })

  }

  private async buffer2Extract(data: ReadData[], isSrc = true): Promise<OfficeContent[]> {
    return new Promise((resolve, reject) => {
      if (!this.opt) {
        reject()
      }
      else {
        const prs: Promise<OfficeContent>[] = [];
        for (const datum of data) {
          const path = datum.name
          if (path.endsWith('.docx') || path.endsWith('.docm')) {
            prs.push(docxReader(datum.data, path, this.opt));
          } else if (path.endsWith('.xlsx') || path.endsWith('.xlsm')) {
            prs.push(xlsxReader(datum.data, path, this.opt));
          } else if (path.endsWith('.pptx') || path.endsWith('.pptm')) {
            // スライドもノートも読み込まない設定の場合はスキップ
            if (this.opt.office.ppt.readSlide || this.opt.office.ppt.readNote) {
              prs.push(pptxReader(datum.data, path, this.opt));
            }
          } else if (path.endsWith('.pdf')) {
            if (typeof (datum.data) !== 'string') {
              prs.push(pdfReader(datum.data, path, this.opt))
            }
          }
        }
        Promise.all(prs).then((res) => {
          resolve(res);
        }).catch((failure: ReadFailure) => {
          reject(failure);
        });
      }
    });
  }

  // OfficeExtractor の関数を呼び出す関数群
  public changeActives(target: 'src' | 'tgt', index: number, actives: boolean[]): void {
    this.ext.changeActives(target, index, actives)
  }

  public changeFilePriority(target: 'src' | 'tgt' | 'both', fx: number, move: -1 | 1): void {
    this.ext.changeFilePriority(target, fx, move)
  }

  public getContentsLength(target: 'src' | 'tgt' | 'longer' | 'shorter'): number {
    return this.ext.getContentsLength(target)
  }

  public getRawContent(target: 'src' | 'tgt'): OfficeContent[] {
    return this.ext.getRawContent(target)
  }

  public dumpToJson(target: 'src' | 'tgt' | 'both'): string {
    return this.ext.dumpToJson(target)
  }

  public getSingleText(from: 'src' | 'tgt', opt: MyOption): string[] {
    return this.ext.getSingleText(from, opt)
  }

  public getAlignedText(opt: MyOption): string[] {
    return this.ext.getAlignedText(opt)
  }

  public getAlignStats(): OfficeFileStats[][] {
    return this.ext.getAlignStats()
  }

  public officeExtractTxt(): string[] {
    if (this.opt) {
      return this.ext.getSingleText('src', this.opt)
    }
    else {
      return []
    }
  }

  public officeAlignTsv(): string[] {
    if (this.opt) {
      return this.ext.getAlignedText(this.opt)
    }
    else {
      return []
    }
  }

  //   public async officeAlignDiffHtml(): Promise<string> {
  //     this.opt.common.withSeparator = false
  //     const text1 = await this.ext.getSingleText('src', this.opt)
  //     const text2 = await this.ext.getSingleText('tgt', this.opt)
  //     if (!this.diff) {
  //       this.diff = new DiffCalculator()
  //     }
  //     const diffed = this.diff.exportDiffText(text2.join('\n'), text1.join('\n'))
  //     return `
  // <!DOCTYPE html>
  // <html lang='en'>
  // <head>
  //     <meta charset='UTF-8'>
  //     <meta http-equiv='X-UA-Compatible' content='IE=edge'>
  //     <meta name='viewport' content='width=device-width, initial-scale=1.0'>
  //     <title>Diff Text by CATOVIS</title>
  //     <style>
  //       ins {
  //         color: blue;
  //       }

  //       del {
  //         color: red
  //       }
  //     </style>
  // </head>
  // <body>
  //     <p>
  //       ${diffed.replace(/\n/g, '<br />')}
  //     </p>
  // </body>
  // </html>
  // `
  //   }

  //   public officeExtractJson(): string {
  //     return JSON.stringify(this.ext.getRawContent('src'), null, 2)
  //   }

  //   public officeExtractDiffJson(): string {
  //     if (!this.diff) {
  //       this.diff = new DiffCalculator()
  //     }
  //     this.diff.analyze(this.ext.getRawContent('src'))
  //     return this.diff.exportResult('diff', 'json')
  //   }

  // ##TODO
  // public officeExtractDiffTovis(): string[] {
  //   this.diff.analyze(this.ext.getRawContent('src'))
  //   this.convDiff2Tovis()
  //   return this.tov.dump()
  // }

  // ##TODO
  // public officeExtractDiffMinTovis(): string[] {
  //   this.diff.analyze(this.ext.getRawContent('src'))
  //   this.convDiff2Tovis()
  //   return this.tov.dumpMinify('CHECK-DUPLI')
  // }

  // public countCharasTsv(): string[] {
  //   return this.ext.simpleCalc('chara')
  // }

  // public countWordsTsv(): string[] {
  //   return this.ext.simpleCalc('word')
  // }

  // public countDiffCharasTsv(): string {
  //   if (!this.diff) {
  //     this.diff = new DiffCalculator()
  //   }
  //   this.diff.analyze(this.ext.getRawContent('src'))
  //   return this.diff.exportResult('wwc-chara', 'human', this.opt.wwc)
  // }

  // public countDiffWordsTsv(): string {
  //   if (!this.diff) {
  //     this.diff = new DiffCalculator()
  //   }
  //   this.diff.analyze(this.ext.getRawContent('src'))
  //   return this.diff.exportResult('wwc-word', 'human', this.opt.wwc)
  // }

  // public readFromJsonStr(data: string, type: JsonType) {
  //   switch (type) {
  //     case 'extract':
  //       this.ext.readFromJSON('both', data)
  //       break;

  //     case 'diff':
  //       if (!this.diff) {
  //         this.diff = new DiffCalculator()
  //       }
  //       this.diff.readFromJson(data)
  //       break;

  //     case 'tovis':
  //       // ##TODO
  //       console.log('To be developed')
  //       // this.tov
  //       break;

  //     default:
  //       break;
  //   }
  // }

  // public dumpToJsonStr(type: JsonType): string {
  //   switch (type) {
  //     case 'extract':
  //       return this.ext.dumpToJson('both')

  //     case 'diff':
  //       if (!this.diff) {
  //         this.diff = new DiffCalculator()
  //       }
  //       return this.diff.dumpToJson()

  //     default:
  //       return ''
  //   }
  // }

  // public convSrcExt2Diff(): void {
  //   if (!this.diff) {
  //     this.diff = new DiffCalculator()
  //   }
  //   this.diff.analyze(this.ext.getRawContent('src'))
  // }

  // public convBilingualExt2Diff(): Promise<boolean> {
  //   return new Promise((resolve, reject) => {
  //     const aligned = this.ext.getAlignedText(this.opt)
  //     if (!this.diff) {
  //       this.diff = new DiffCalculator()
  //     }
  //     this.diff.analyzeFromText(aligned.join('\n'))
  //     resolve(true)
  //   })
  // }
}