import { ReadingOption } from "./util/option"
// import { OfficeExtractor } from "./office/officeExtractor"
import { DiffCalculator } from "./diffs/diffCalc"
// import { CatDataContent } from "./cat/cat"
// import { Tovis } from "./tovis/tovis"

// export type JsonType = 'extract' | 'diff' | 'cat' | 'tovis'
import { largeModes, officeModes, countModes, catModes } from './util/params'
import type { ModeLarge, ModeMiddleOffice, ModeMiddleCount, ModeMiddleCat } from './util/params'
import { OfficeExtractWrapper } from "./office/officeIndex"

export class CatovisOrganizer {
  // static largeModes = largeModes
  // static officeModes = officeModes
  // static countModes = countModes
  // static catModes = catModes

  public lg: ModeLarge
  public mid: ModeMiddleOffice | ModeMiddleCount | ModeMiddleCat
  protected hasAnyErr: string[]
  public src: ReadData[];
  public tgt: ReadData[];

  public opt: ReadingOption;
  public office: OfficeExtractWrapper;

  public diff: DiffCalculator;
  // public cat: CatDataContent;
  // public tov: Tovis;
  public wwc: WWCRate
  public recomendFormat: string

  constructor() {
    this.lg = largeModes[0]
    this.mid = officeModes[0]
    this.hasAnyErr = []
    this.src = []
    this.tgt = []
    this.opt = new ReadingOption()
    this.office = new OfficeExtractWrapper()
    this.diff = new DiffCalculator()
    // this.cat = new CatDataContent()
    // this.tov = new Tovis()
    this.wwc = {
      dupli: 1,
      over95: 1,
      over85: 1,
      over75: 1,
      over50: 1,
      under49: 1,
    }
    this.recomendFormat = '.txt'
  }

  public readOption(opq: OptionQue) {
    this.opt.setOfficeOptions(opq)
  }

  public addContent(content: ReadData[], isSrc: boolean = true): void {
    if (isSrc) {
      this.src.push(...content)
    }
    else {
      this.tgt.push(...content)
    }
  }

  public resetContent(): void {
    this.src.length = 0
    this.tgt.length = 0
  }

  // ModeLargeを設定する
  public setModeLarge(large: string | undefined | null): void {
    if (large === undefined || large === null || large == "") {
      this.hasAnyErr.push('LARGE')
    } else {
      let isOk = false
      for (const modelg of largeModes) {
        if (large === modelg) {
          this.lg = large as ModeLarge
          isOk = true
          break
        }
      }
      if (!isOk) {
        this.hasAnyErr.push('LARGE')
      }
    }
  }

  // ModeMiddleを設定する
  public setModeMiddle(middle: string | undefined | null, recomendFormat?: string): void {
    this.recomendFormat = recomendFormat !== undefined ? recomendFormat
      : middle === undefined || middle === null ? this.recomendFormat
        : middle.substring(middle.lastIndexOf(' ') + 1)
    if (this.recomendFormat === 'min-tovis') {
      this.recomendFormat = 'mtovis'
    }
    if (middle === undefined || middle === null || middle === "") {
      this.hasAnyErr.push('MIDDLE')
    } else {
      let isOk = false
      switch (this.lg) {
        case 'OFFICE':
          for (const modemd of officeModes) {
            if (middle === modemd) {
              this.mid = middle as ModeMiddleOffice
              isOk = true
              break
            }
          }
          if (!isOk) {
            this.hasAnyErr.push('MIDDLE OFFICE')
          }
          break;

        case 'COUNT':
          for (const modemd of countModes) {
            if (middle === modemd) {
              this.mid = middle as ModeMiddleCount
              isOk = true
              break
            }
          }
          if (!isOk) {
            this.hasAnyErr.push('MIDDLE COUNT')
          }
          break;

        case 'CAT':
          for (const modemd of catModes) {
            if (middle === modemd) {
              this.mid = middle as ModeMiddleCat
              isOk = true
              break
            }
          }
          if (!isOk) {
            this.hasAnyErr.push('MIDDLE CAT')
          }
          break;

        default:
          this.hasAnyErr.push('MIDDLE VALUE INCORRECT')
          break;
      }
    }
  }

  public setOfficeOptions(opq: OptionQue | undefined | null): boolean {
    if (opq === undefined || opq === null) {
      return false
    } else {
      this.opt.setOfficeOptions(opq)
      return true
    }
  }

  public setWWCOption(wwc?: WWCRate) {
    if (wwc) {
      this.opt.setWWCOption(wwc)
    }
  }

  public setCatOptions(cop?: CatOption) {
    if (cop) {
      this.opt.setCatOptions(cop)
    }
  }

  public dumpOption(): Required<OptionQue> {
    return this.opt.createOptionQue()
  }

  public async execOffice(): Promise<string | string[]> {
    return new Promise<string | string[]>(async (resolve, reject) => {
      this.office.setExtract(this.src, this.tgt, this.opt).then(data => {
        switch (this.mid) {
          case 'EXTRACT txt':
            resolve(this.office.getSingleText('src', this.opt))
            break;

          case 'EXTRACT json':
            resolve(JSON.stringify(this.office.getRawContent('src'), null, 2))
            break

          case 'ALIGN tsv':
            resolve(this.office.getAlignedText(this.opt))
            break;

          case 'ALIGN-DIFF html': {
            resolve(this.officeAlignDiffHtml())
            break
          }

          case 'EXTRACT-DIFF json':
            this.diff.analyze(data.src)
            resolve(this.diff.exportResult('diff', 'json'))
            break

          // case 'EXTRACT-DIFF tovis':
          //   resolve(this.officeExtractDiffTovis())
          //   break

          // case 'EXTRACT-DIFF min-tovis':
          //   resolve(this.officeExtractDiffMinTovis())
          //   break

          case 'CHARAS tsv':
            resolve(this.diff.officeCalcSimple(data.src, 'chara', this.opt))
            break;

          case 'WORDS tsv':
            resolve(this.diff.officeCalcSimple(data.src, 'word', this.opt))
            break;

          case 'DIFF-CHARAS tsv':
            this.diff.analyze(data.src)
            resolve(this.diff.exportResult('wwc-chara', 'human', this.opt.wwc))
            break

          case 'DIFF-WORDS tsv':
            this.diff.analyze(data.src)
            resolve(this.diff.exportResult('wwc-word', 'human', this.opt.wwc))
            break

          default:
            reject(false)
            break;
        }
      })
    })
  }



  // Office または Count を実行する場合の子関数
  public async officeAlignDiffHtml(): Promise<string> {
    this.opt.common.withSeparator = false
    const text1 = await this.office.getSingleText('src', this.opt)
    const text2 = await this.office.getSingleText('tgt', this.opt)
    const diffed = this.diff.exportDiffText(text2.join('\n'), text1.join('\n'))
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Diff Text by CATOVIS</title>
    <style>
      ins {
        color: blue;
      }
    
      del {
        color: red
      }
    </style>
</head>
<body>
    <p>
      ${diffed.replace(/\n/g, '<br />')}
    </p>
</body>
</html>
`
  }


  // public officeExtractDiffTovis(): string[] {
  //   this.diff.analyze(this.office.getRawContent('src'))
  //   this.convDiff2Tovis()
  //   return this.tov.dump()
  // }

  // public officeExtractDiffMinTovis(): string[] {
  //   this.diff.analyze(this.office.getRawContent('src'))
  //   this.convDiff2Tovis()
  //   return this.tov.dumpMinify('CHECK-DUPLI')
  // }


  // public execCat(names: string[], xliffs: string[], tsv: string[][]): Promise<string[]> {
  //   return new Promise(async (resolve, reject) => {
  //     switch (this.mid) {
  //       case 'EXTRACT tsv':
  //         resolve(await this.catExtractTsv(names, xliffs))
  //         break;

  //       case 'EXTRACT-DIFF json':
  //         resolve(await this.catExtractDiffJson(names, xliffs))
  //         break;

  //       case 'EXTRACT-DIFF tovis':
  //         resolve(await this.catExtractDiffTovis(names, xliffs))
  //         break;

  //       case 'EXTRACT-DIFF min-tovis':
  //         resolve(await this.catExtractDiffMinTovis(names, xliffs))
  //         break;

  //       case 'UPDATE xliff': {
  //         resolve(await this.catUpdateXliff(names, xliffs, tsv))
  //         break;
  //       }

  //       case 'REPLACE xliff':
  //         resolve(await this.catReplaceXliff(names, xliffs, tsv))
  //         break;

  //       default:
  //         break;
  //     }
  //   })
  // }

  // // CATファイルを処理する際の子関数
  // public catExtractTsv(names: string[], xliffs: string[]): Promise<string[]> {
  //   return new Promise((resolve, reject) => {
  //     this.cat.batchLoadMultilangXml(names, xliffs, this.opt.cat)
  //     const multis = this.cat.getMultipleTexts("all", false)
  //     const result: string[] = []
  //     multis.forEach(multi => {
  //       result.push(multi.join('\t'))
  //     })
  //     resolve(result)
  //   })
  // }

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

  // public catUpdateXliff(names: string[], xliffs: string[], tsv: string[][]): Promise<string[]> {
  //   return new Promise((resolve, reject) => {
  //     this.cat.batchUpdateXliff(names, xliffs, tsv, false, this.opt.cat.overWrite)
  //       .then(result => resolve(result))
  //       .catch(err => reject(err))
  //   })
  // }

  // public catReplaceXliff(names: string[], xliffs: string[], tsv: string[][]): Promise<string[]> {
  //   return new Promise((resolve, reject) => {
  //     this.cat.batchUpdateXliff(names, xliffs, tsv, true, this.opt.cat.overWrite)
  //       .then(result => resolve(result))
  //       .catch(err => reject(err))
  //   })
  // }

  // public readFromJsonStr(data: string, type: JsonType) {
  //   switch (type) {
  //     case 'extract':
  //       this.office.readFromJSON("both", data)
  //       break;

  //     case 'diff':
  //       this.diff.readFromJson(data)
  //       break;

  //     case 'cat':
  //       this.cat.readFromJson(data)
  //       break;

  //     case 'tovis':
  //       // this.tov
  //       break;

  //     default:
  //       break;
  //   }
  // }

  // public dumpToJsonStr(type: JsonType): string {
  //   switch (type) {
  //     case 'extract':
  //       return this.office.dumpToJson('both')

  //     case 'diff':
  //       return this.diff.dumpToJson()

  //     case 'cat':
  //       return this.cat.dumpToJson()

  //     case 'tovis':
  //       return this.tov.dumpToJson()

  //     default:
  //       return ''
  //   }
  // }

  // public convCat2Extract(srcLang?: string, tgtLang?: string): void {
  //   const catext = this.cat.dumpToExt(srcLang, tgtLang)
  //   const srcs: OfficeContent[] = []
  //   const tgts: OfficeContent[] = []
  //   catext.forEach(ext => {
  //     srcs.push(ext.src)
  //     tgts.push(ext.tgt)
  //   })
  //   this.office.setContent(srcs, tgts)
  // }

  // public convSrcExt2Diff(): void {
  //   this.diff.analyze(this.office.getRawContent('src'))
  // }

  // public convBilingualExt2Diff(): Promise<boolean> {
  //   return new Promise((resolve, reject) => {
  //     this.office.getAlignedText(this.opt)
  //       .then(aligned => {
  //         this.diff.analyzeFromText(aligned.join("\n"))
  //         resolve(true)
  //       })
  //       .catch(() => {
  //         reject()
  //       })
  //   })
  // }

  // public convExt2Tovis(): void {
  //   this.tov.parseFromExt(this.office)
  // }

  // public convDiff2Tovis(): void {
  //   this.tov.parseFromDiff(this.diff)
  // }
}