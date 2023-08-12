import { ReadingOption } from '#/util/option'
import { OfficeExtractor } from '#/office/officeExtractor'
import { DiffCalculator } from '#/diffs/diffCalc'
import { CatDataContent } from '#/cat/cat'
import { useErrorMessage } from '#/util/util'

import { largeModes, officeModes, countModes, catModes } from '#/util/params'
import type { ModeLarge, ModeMiddleOffice, ModeMiddleCount, ModeMiddleCat } from '#/util/params'

export class CatOrganizer {
  public moduleName = 'Cat'
  public mid: ModeMiddleCat | ''

  public opt: ReadingOption;
  public diff?: DiffCalculator;
  public cat: CatDataContent;
  public recomendFormat: string

  constructor() {
    this.mid = ''
    this.opt = new ReadingOption()
    // this.ext = new ExtractContext()
    this.cat = new CatDataContent()
    this.recomendFormat = '.txt'
  }

  public readOption(opq: OptionQue) {
    this.opt.setOfficeOptions(opq)
  }


  public setModeMiddle(middle: string | undefined | null, recomendFormat?: string): ErrorMessage {
    this.recomendFormat = recomendFormat !== undefined ? recomendFormat
      : middle === undefined || middle === null ? this.recomendFormat
        : middle.substring(middle.lastIndexOf(' ') + 1)
    if (middle === undefined || middle === null || middle === '') {
      return useErrorMessage(
        { isErr: true, code: this.moduleName + '1', name: 'Mode Select', message: 'This is not valid mode' }
      )
    } else {
      for (const modemd of catModes) {
        if (middle === modemd) {
          this.mid = middle as ModeMiddleCat
          return useErrorMessage({})
          break
        }
      }
    }
    return useErrorMessage(
      { isErr: true, code: this.moduleName + '2', name: 'Mode Select', message: 'This is not valid mode' }
    )
  }

  public setCatOptions(cop?: CatOption) {
    if (cop) {
      this.opt.setCatOptions(cop)
    }
  }

  public dumpOption(): Required<OptionQue> {
    return this.opt.createOptionQue()
  }

  public execCat(names: string[], xliffs: string[], tsv: string[][]): Promise<string[]> {
    return new Promise(async (resolve, reject) => {
      switch (this.mid) {
        case 'EXTRACT tsv':
          resolve(await this.catExtractTsv(names, xliffs))
          break;

        case 'EXTRACT-DIFF json':
          // resolve(await this.catExtractDiffJson(names, xliffs))
          break;

        case 'EXTRACT-DIFF tovis':
          // resolve(await this.catExtractDiffTovis(names, xliffs))
          break;

        case 'EXTRACT-DIFF min-tovis':
          // resolve(await this.catExtractDiffMinTovis(names, xliffs))
          break;

        case 'UPDATE xliff': {
          resolve(await this.catUpdateXliff(names, xliffs, tsv))
          break;
        }

        case 'REPLACE xliff':
          resolve(await this.catReplaceXliff(names, xliffs, tsv))
          break;

        default:
          break;
      }
    })
  }

  // CATファイルを処理する際の子関数
  public catExtractTsv(names: string[], xliffs: string[]): Promise<string[]> {
    return new Promise((resolve, reject) => {
      this.cat.batchLoadMultilangXml(names, xliffs, this.opt.cat)
      const multis = this.cat.getMultipleTexts('all', false)
      const result: string[] = []
      multis.forEach(multi => {
        result.push(multi.join('\t'))
      })
      resolve(result)
    })
  }

  // public catExtractDiffJson(names: string[], xliffs: string[]): Promise<string[]> {
  //   return new Promise((resolve, reject) => {
  //     this.cat.batchLoadMultilangXml(names, xliffs, this.opt.cat)
  //     this.convCat2Extract()
  //     this.convSrcExt2Diff()
  //     resolve([this.dumpToJsonStr('diff')])
  //   })
  // }

  // public catExtractDiffTovis(names: string[], xliffs: string[]): Promise<string[]> {
  //   return new Promise((resolve, reject) => {
  //     this.cat.batchLoadMultilangXml(names, xliffs, this.opt.cat)
  //     this.convCat2Extract()
  //     this.convSrcExt2Diff()
  //     this.convDiff2Tovis()
  //     resolve(this.tov.dump())
  //   })
  // }

  // public catExtractDiffMinTovis(names: string[], xliffs: string[]): Promise<string[]> {
  //   return new Promise((resolve, reject) => {
  //     this.cat.batchLoadMultilangXml(names, xliffs, this.opt.cat)
  //     this.convCat2Extract()
  //     this.convSrcExt2Diff()
  //     this.convDiff2Tovis()
  //     resolve(this.tov.dumpMinify('CHECK-DUPLI'))
  //   })
  // }

  public catUpdateXliff(names: string[], xliffs: string[], tsv: string[][]): Promise<string[]> {
    return new Promise((resolve, reject) => {
      this.cat.batchUpdateXliff(names, xliffs, tsv, false, this.opt.cat.overWrite)
        .then(result => resolve(result))
        .catch(err => reject(err))
    })
  }

  public catReplaceXliff(names: string[], xliffs: string[], tsv: string[][]): Promise<string[]> {
    return new Promise((resolve, reject) => {
      this.cat.batchUpdateXliff(names, xliffs, tsv, true, this.opt.cat.overWrite)
        .then(result => resolve(result))
        .catch(err => reject(err))
    })
  }

  // public readFromJsonStr(data: string, type: JsonType) {
  //   this.cat.readFromJson(data, type)
  // }

  // public dumpToJsonStr(type: JsonType): string {
  //   return this.cat.dumpToJson()
  // }

  public convCat2Extract(srcLang?: string, tgtLang?: string): { src: OfficeContent[], tgt: OfficeContent[] } {
    const catext = this.cat.dumpToExt(srcLang, tgtLang)
    const src: OfficeContent[] = []
    const tgt: OfficeContent[] = []
    catext.forEach(ext => {
      src.push(ext.src)
      tgt.push(ext.tgt)
    })
    return { src, tgt }
  }

  // public convBilingualExt2Diff(): Promise<boolean> {
  //   return new Promise((resolve, reject) => {
  //     this.ext.getAlignedText(this.opt)
  //       .then(aligned => {
  //         this.diff.analyzeFromText(aligned.join('\n'))
  //         resolve(true)
  //       })
  //       .catch(() => {
  //         reject()
  //       })
  //   })
  // }
}