import { parseString } from 'xml2js';

import { path2ContentStr } from './util-sv'
import { applySegRules, countCharas, countWords, checkValidText, cnm } from './util';

export class CatDataContent {
  // public toolName: string;
  public fileNames: string[];
  private langs: string[];
  private contents: TranslationUnit[][];

  constructor() {
    // this.toolName = '';
    this.fileNames = [];
    this.langs = [];
    this.contents = [];
  }

  public loadMultlangXml(fileName: string, xmlStr: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const name = fileName.toLowerCase()
      if (name.endsWith('xliff')) {
        this.loadXliffString(fileName, xmlStr).then(() => {
          resolve(true)
        }).catch(e => {
          reject(e)
        })
      } else if (name.endsWith('.tmx')) {
        this.fileNames.push(name)
        this.loadTmxString(xmlStr).then(() => {
          resolve(true)
        }).catch(e => {
          reject(e)
        })
      } else if (name.endsWith('.tbx')) {
        this.fileNames.push(name)
        this.loadTbxString(xmlStr).then(() => {
          resolve(true)
        }).catch(e => {
          reject(e)
        })
      } else {
        reject('This Program only support "XLIFF", "TMX" and "TBX" files' )
      }
    })
  }

  public getLangsInfo(): string[] {
    return this.langs;
  }

  public getLangExists(lang: string): boolean {
    return this.langs.indexOf(lang) !== -1;
  }

  public getFilesInfo(): string[] {
    return this.fileNames;
  }

  public getContentLength(): number {
    return this.contents.length;
  }

  public getContentStats(): string {
    const stats = {
      files: this.fileNames,
      langs: this.langs,
      segments: this.getContentLength(),
    }
    return JSON.stringify(stats, null, 2)
  }

  public getSingleText(lang: string): string[] {
    const isValidLang = this.getLangExists(lang);
    let lang_ = lang;
    if (!isValidLang) {
      console.log('Use Source Lang')
      lang_ = this.langs[0];
    }
    const singleLang: string[] = []
    for (const tuset of this.contents) {
      for (const tu of tuset) {
        if (tu.lang === lang_) {
          singleLang.push(tu.text)
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
    for (const tuset of this.contents) {
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
    return texts;
  }

  public exportTMX(): string {
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
    for (const tuset of this.contents) {
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
          for (const file of files) {
            const oriFileName = file.$['original'] || ''
            if (oriFileName !== '') {
              this.fileNames.push(`[${oriFileName}]_${xliffName}`)
            } else {
              this.fileNames.push(xliffName)
            }
            const srcLang = file.$['source-language'] || ''
            if (this.langs.indexOf(srcLang) === -1) {
              this.langs.push(srcLang)
            }
            const tgtLang = file.$['target-language'] || ''
            if (this.langs.indexOf(tgtLang) === -1) {
              this.langs.push(tgtLang)
            }
            const body = file.body || [{}]
            const groups = body[0].group || []
            for (const group of groups) {
              const unit: TranslationUnit[] = []
              const tu = group['trans-unit'] || [{}]
              const srcText = tu[0].source || ''
              const tgtText = tu[0].target || ''
              if (srcText !== '') {
                unit.push({
                  lang: srcLang,
                  text: srcText
                })
              }
              if (tgtText !== '') {
                unit.push({
                  lang: tgtLang,
                  text: tgtText
                })
              }
              if (unit.length > 0) {
                this.contents.push(unit)
              }
            }
          }
          resolve(true);
        }
      })
    })
  }
  
  private loadTmxString(data: string): Promise<boolean> {
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
                  units.push({lang, text})
                }
              }
              this.contents.push(units)
            }
            // const toolName = headerAttr.creationtool || '';
            // const toolVer = headerAttr.creationtoolversion || ''; 
            // this.toolName = `${toolName}@${toolVer}`
            resolve(true);
          }
        }
      })
    })
  }

  private loadTbxString(data: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      parseString(data, (err: Error | null, tbx: any) => {
        if (err !== null) {
          console.log(err)
          reject(err)
        } else {
          // 	Machine Readable Terminology Interchange Format
          const martifTag = tbx.martif || [{}];
          const textTag = martifTag.text || [{}];
          const bodyTag = textTag[0].body || [{}];
          const termEntries = bodyTag[0].termEntry || []
          if (termEntries.length === 0) {
            reject('empty content')
          } else {
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
              this.contents.push(units)
            }
            // const toolName = '';
            // const toolVer = ''; 
            // this.toolName = `${toolName}@${toolVer}`
            resolve(true);
          }
        }
      })
    })
  }

  private getValidLangArray(langs: string[]): string[] {
    return langs.filter(val => {
      return this.getLangExists(val)
    });
  }

}


// const samples = ['./cattest/merged.mxliff']
// const cat = new CatDataContent()
// const prs: Promise<boolean>[] = []
// for (const sample of samples) {
//   const xml = path2ContentStr(sample);
//   prs.push(cat.loadMultlangXml(sample, xml))
// }
// Promise.all(prs).then(() => {
//   const exp = cat.getSingleText('all')
//   console.log(exp)
// }).catch(e => {
//   console.log(e)
// })   
// const ext = tmx.getSingleText('ja')
// const exts = tmx.getMultipleTexts(['ja', 'zh-cn'], true)
