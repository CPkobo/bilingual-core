import { parseString, Builder } from 'xml2js';
// import Js2Xml from 'js2xml'

import { countFromDoubleArray, path2Format, str2ExtractedText } from '../util/util';

export class CatDataContent {
  // public toolName: string;
  // public fileNames: string[];
  private langs: string[];
  // 実際のファイルごとにユニットを保存する
  // 1つのセンテンス（用語）について、{lang: string, text: string}からなる配列があり、
  // 1つのファイルはその配列の配列からなる
  private contents: Array<{
    file: string
    units: TranslationUnit[][];
  }>

  constructor() {
    // this.toolName = '';
    // this.fileNames = [];
    this.langs = [];
    this.contents = [];
  }

  public readFromJson(data: string): void {
    const jdata = JSON.parse(data)
    // if (jdata.fileNames !== undefined) {
    //   this.fileNames = jdata.fileNames
    // }
    if (jdata.langs !== undefined) {
      this.langs = jdata.langs
    }
    if (jdata.contents !== undefined) {
      this.contents = jdata.contents
    }
  }

  public dumpToJson(): string {
    const data = {
      // fileNames: this.fileNames,
      langs: this.langs,
      contents: this.contents
    }
    return JSON.stringify(data, null, 2)
  }

  public getLangsInfo(): string[] {
    return this.langs;
  }

  public getLangExists(lang: string): boolean {
    return this.langs.indexOf(lang) !== -1;
  }

  public getFilesInfo(): string[] {
    const fileNames: string[] = []
    this.contents.forEach(content => {
      fileNames.push(content.file)
    })
    return fileNames;
  }

  public getContentLength(): number {
    return this.contents.length;
  }

  public getContentStats(langs: string[] | 'all', onlyFullUnit: boolean = false, unit: CountType = 'both'): [XliffStats, string[][]] {
    const files = this.getFilesInfo()
    // const contents: XliffFileStats[] = []
    const stats: XliffStats = {
      fileNum: this.contents.length,
      locales: this.langs,
      charas: 0,
      words: 0,
      contents: []
    }
    const texts = this.getMultipleTexts(langs, onlyFullUnit)
    this.contents.forEach(inFile => {
      const fileStats: XliffFileStats = {
        name: inFile.file,
        lines: inFile.units.length
      }
      if (unit === 'chara' || unit === 'both') {
        fileStats.charas = countFromDoubleArray(texts, 'chara', 0)
        stats.charas += fileStats.charas
      }
      if (unit === 'word' || unit === 'both') {
        fileStats.words = countFromDoubleArray(texts, 'word', 0)
        stats.words += fileStats.words
      }
      stats.contents.push(fileStats)
    })
    return [stats, texts]
  }

  public batchLoadMultilangXml(names: string[], xmlStr: string[], opt: CatOption): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const prs: Promise<boolean>[] = []
      for (let i = 0; i < names.length; i++) {
        prs.push(this.loadMultilangXml(names[i], xmlStr[i]))
      }
      Promise.all(prs)
        .then(() => {
          resolve(true)
          // const [stats, tsv] = this.getContentStats(opt.locales, opt.fullset, 'both')
          // const tsv_: string[] = []
          // for (const t of tsv) {
          //   tsv_.push(t.join('\t'))
          // }
          // resolve(tsv_)
        })
        .catch(() => {
          reject(false)
        })
    })
  }

  public loadMultilangXml(name: string, xmlStr: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const fileName = name.toLowerCase()
      if (fileName.endsWith('xliff')) {
        this.loadXliffString(name, xmlStr).then(() => {
          resolve(true)
        }).catch(e => {
          reject(e)
        })
      } else if (fileName.endsWith('.tmx')) {
        // this.fileNames.push(fileName)
        this.loadTmxString(name, xmlStr).then(() => {
          resolve(true)
        }).catch(e => {
          reject(e)
        })
      } else if (fileName.endsWith('.tbx')) {
        // this.fileNames.push(fileName)
        this.loadTbxString(name, xmlStr).then(() => {
          resolve(true)
        }).catch(e => {
          reject(e)
        })
      } else {
        reject('This Program only support "XLIFF", "TMX" and "TBX" files')
      }
    })
  }

  public getSingleText(lang: string): string[] {
    const isValidLang = this.getLangExists(lang);
    let lang_ = lang;
    if (!isValidLang) {
      console.log('Use Source Lang')
      lang_ = this.langs[0];
    }
    const singleLang: string[] = []
    for (const content of this.contents) {
      for (const inFile of content.units) {
        for (const tu of inFile) {
          if (tu.lang === lang_) {
            singleLang.push(tu.text)
          }
        }
      }
    }
    return singleLang;
  }

  public getMultipleTexts(langs: string[] | 'all', onlyFullUnit: boolean = false): string[][] {
    let langs_: string[] = [];
    if (langs === 'all') {
      langs_ = this.langs
    } else {
      langs_ = this.getValidLangArray(langs);
    }
    const langNum = langs_.length;
    const texts: string[][] = []
    for (const inFile of this.contents) {
      for (const tuset of inFile.units) {
        const inTexts = Array(langNum).fill('')
        for (const tu of tuset) {
          const lgx: number = langs_.indexOf(tu.lang)
          if (lgx > -1) {
            inTexts[lgx] = tu.text
          }
        }
        if (onlyFullUnit) {
          // 空白文字列が残っていないセットのみをpush
          if (inTexts.indexOf('') === -1) {
            texts.push(inTexts)
          }
        } else {
          texts.push(inTexts)
        }
      }
    }
    return texts;
  }

  public dumpToExt(srcLang?: string, tgtLang?: string): BilingualExt[] {
    const sl = srcLang || this.langs[0]
    const tl = tgtLang || this.langs[1]
    const bilingual: BilingualExt[] = []
    let idx = 0
    for (const inFile of this.contents) {
      idx++
      const format = path2Format(inFile.file) as FileFormat
      const srcs: string[] = []
      const tgts: string[] = []
      for (const unit of inFile.units) {
        for (const tu of unit) {
          if (tu.lang === sl) {
            srcs.push(tu.text)
          }
          if (tu.lang === tl) {
            tgts.push(tu.text)
          }
        }
      }
      const srcExt: ExtractedContent = {
        name: inFile.file,
        format,
        exts: [str2ExtractedText(srcs, idx, 'Bilingual')]
      }
      const tgtExt: ExtractedContent = {
        name: inFile.file,
        format,
        exts: [str2ExtractedText(tgts, idx, 'Bilingual')]
      }
      bilingual.push({
        src: srcExt,
        tgt: tgtExt
      })
    }
    return bilingual
  }

  public batchUpdateXliff(names: string[], xliffs: string[], tsv: string[][], asTerm: boolean, overWrite: boolean): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
      const prs: Promise<CatUpdateLog>[] = []
      for (let i = 0; i < names.length; i++) {
        prs.push(this.updateXliff(names[i], xliffs[i], tsv, asTerm, overWrite))
      }
      Promise.all(prs)
        .then(results => {
          const logs: Omit<CatUpdateLog, 'xml'>[] = []
          const xmls: string[] = []
          results.forEach(result => {
            logs.push({
              filename: result.filename,
              already: result.already,
              updated: result.updated,
              notFounds: result.notFounds
            })
            xmls.push(result.xml)
            resolve([JSON.stringify(logs, null, 2), ...xmls])
          })
        })
    })
  }

  public updateXliff(name: string, xliffStr: string, tsv: string[][], asTerm: boolean, overWrite: boolean): Promise<CatUpdateLog> {
    return new Promise((resolve, reject) => {
      parseString(xliffStr, (err: Error | null, xliff) => {
        if (err !== null) {
          console.log(err)
          reject(false)
        } else {
          const xliffTag = xliff.xliff || [{}];
          const files = xliffTag.file || []
          const already: string[] = []
          const updated: string[] = []
          const notFounds: string[] = []
          for (const file of files) {
            const body = file.body || [{}]
            const groups = body[0].group || []
            for (const group of groups) {
              const gid = Number(group.$.id) + 1
              const tu = group['trans-unit'] || [{}];
              const srcTag: string[] = tu[0].source || [''];
              const tgtTag: string[] = tu[0].target || [''];
              const srcText = srcTag[0]
              const tgtText = tgtTag[0]
              if (srcText === '') {
                continue;
              } else if (overWrite === false && tgtText !== '') {
                already.push(`${gid}: ${srcText}`)
                continue;
              }
              const upTgt = asTerm ? this.searchTranslation(srcText, tsv) : this.applyTermbase(srcText, tsv);
              if (upTgt === '') {
                notFounds.push(`${gid}: ${srcText}`);
              }
              else {
                tu[0].target[0] = upTgt;
                updated.push(`${gid}: ${srcText}`)
              }
            }
          }
          // file タグに対する繰り返しここまで
          const builder = new Builder()
          resolve({
            filename: name,
            xml: builder.buildObject(xliff),
            already,
            updated,
            notFounds
          })
        }
      })
    })

  }

  public exportTMX(idx: number): string {
    const attrs = [
      `creationtool='CATOVIS CLI'`,
      `creationtoolversion='0.2.0'`,
      `segtype='sentence'`,
      `adminlang='en'`,
      `srclang='${this.langs[0]}'`,
      `o-tmf='CATOVIS'`,
      `datatype='unknown'`,
    ];
    const attr = attrs.join(' ');
    const headers = [
      `<?xml version='1.0' encoding='UTF-8'?>`,
      `<tmx version='1.4'>`,
      `<header ${attr}>`,
      `</header>`,
    ];
    const body: string[] = ['<body>'];
    // UIDはとりあえず未定
    const uid = '****************';
    const target = this.contents[idx]
    for (const tuset of target.units) {
      const singleTu: string[] = [`<tu tuid='${uid}'>`];
      for (const tu of tuset) {
        if (tu.text !== '') {
          singleTu.push(`<tuv xml:lang='${tu.lang}'>\n<seg>${tu.text}</seg>\n</tuv>`);
        }
      }
      singleTu.push(`</tu>`);
      body.push(singleTu.join(''))
    }
    body.push('</body>\n</tmx>');
    return headers.join('\n') + '\n' + body.join('\n')
  }

  private loadXliffString(xliffName: string, data: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      parseString(data, (err: Error | null, xliff: any) => {
        if (err !== null) {
          console.log(err)
          reject(false)
        } else {
          const xliffTag = xliff.xliff || [{}];
          const files = xliffTag.file || []
          const content: {
            file: string
            units: TranslationUnit[][];
          } = {
            file: '',
            units: []
          }
          for (const file of files) {
            const oriFileName = file.$['original'] || ''
            if (oriFileName !== '') {
              content.file += `[${oriFileName}]_${xliffName} | `
            } else {
              content.file += xliffName
            }
            const srcLang = file.$['source-language'] || ''
            if (this.langs.indexOf(srcLang) === -1) {
              this.langs.push(srcLang)
            }
            const tgtLang = file.$['target-language'] || ''
            if (this.langs.indexOf(tgtLang) === -1) {
              this.langs.push(tgtLang)
            }
            const body: any[] = file.body || [{}]
            const groups: any[] | undefined = body[0].group;
            const tus: any[] = groups ? groups.map((val: any) => {
              return val['trans-unit'][0]
            }) : body[0]['trans-unit'];
            for (const tu of tus) {
              const unit = [];
              const srcText = tu.source[0] || '';
              const tgtText = tu.target[0] || '';
              if (srcText !== '') {
                unit.push({
                  lang: srcLang,
                  text: srcText._ ? srcText._ : srcText
                });
              }
              if (tgtText !== '') {
                unit.push({
                  lang: tgtLang,
                  text: tgtText._ ? tgtText._ : tgtText
                });
              }
              if (unit.length > 0) {
                content.units.push(unit);
              }
            }
          }
          this.contents.push(content)
          resolve(true);
        }
      })
    })
  }

  private loadTmxString(name: string, data: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      parseString(data, (err: Error | null, tmx: any) => {
        if (err !== null) {
          console.log(err)
          reject(false)
        } else {
          const header = tmx.tmx.header || [];
          const body = tmx.tmx.body || [{}];
          if (header.length === 0 || body.length === 0) {
            reject('empty content')
          } else {
            const headerAttr = header[0].$
            const srcLang = headerAttr.srclang
            this.langs[0] === srcLang
            const tus = body[0].tu || []
            const content: {
              file: string
              units: TranslationUnit[][];
            } = {
              file: name,
              units: []
            }
            for (const tu of tus) {
              const tuvs = tu.tuv || []
              const units: TranslationUnit[] = []
              for (const tuv of tuvs) {
                const lang = tuv.$['xml:lang']
                if (this.langs.indexOf(lang) === -1) {
                  this.langs.push(lang)
                }
                const text = tuv.seg.join('')
                if (text !== '') {
                  units.push({ lang, text })
                }
                content.units.push(units)
              }
            }
            this.contents.push(content)
            resolve(true);
          }
        }
      })
    })
  }

  private loadTbxString(name: string, data: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      parseString(data, (err: Error | null, tbx: any) => {
        if (err !== null) {
          console.log(err)
          reject(err)
        } else {
          const martifTag = tbx.martif || [{}];
          const textTag = martifTag.text || [{}];
          const bodyTag = textTag[0].body || [{}];
          const termEntries = bodyTag[0].termEntry || []
          if (termEntries.length === 0) {
            reject('empty content')
          } else {
            const content: {
              file: string
              units: TranslationUnit[][];
            } = {
              file: name,
              units: []
            }
            for (const termEntry of termEntries) {
              const units: TranslationUnit[] = [];
              for (const langSet of termEntry.langSet) {
                const lang = langSet.$['xml:lang'];
                if (this.langs.indexOf(lang) === -1) {
                  this.langs.push(lang);
                }
                const tig = langSet.tig || [{}];
                const term = tig[0].term || [];
                const text = term.join('');
                if (text !== '') {
                  units.push({ lang, text });
                }
              }
              content.units.push(units)
            }
            this.contents.push(content)
            resolve(true);
          }
        }
      })
    })
  }

  private searchTranslation(src: string, transPairs: string[][]): string {
    let tgt = ''
    for (const transPair of transPairs) {
      if (src === transPair[0]) {
        tgt = transPair[1]
        break
      }
    }
    return tgt
  }

  private applyTermbase(src: string, transPairs: string[][]): string {
    let tgt = src
    for (const transPair of transPairs) {
      tgt = tgt.replace(transPair[0], transPair[1])
    }
    return tgt
  }

  private getValidLangArray(langs: string[]): string[] {
    return langs.filter(val => {
      return this.getLangExists(val)
    });
  }

}

