import { parseString } from 'xml2js';

import { path2ContentStr } from '../util-sv'
import { applySegRules, countCharas, countWords, checkValidText } from '../util';
import { InternalSymbolName } from 'typescript';

interface TranslationUnit {
  lang: string,
  text: string,
}

export class TmxContent {
  private langs: string[];
  private contents: TranslationUnit[][];

  constructor() {
    this.langs = [];
    this.contents = [];
  }

  public loadXmlString(data: string): Promise<string[][]> {
    return new Promise((resolve, reject) => {
      parseString(data, (err: Error | null, tmx: any) => {
        if (err !== null) {
          console.log(err)
          reject(err)
        } else {
          // console.log(tmx)
          const header = tmx.tmx.header || [];
          const body = tmx.tmx.body || [];
          if (header.length === 0 || body.length === 0) {
            reject('empty content')
          } else {
            const headerAttr = header[0].$
            const srcLang = headerAttr.srclang
            const tus = body[0].tu || []
            for (const tu of tus) {
              const tuvs = tu.tuv || []
              const units: TranslationUnit[] = []
              for (const tuv of tuvs) {
                const lang = tuv.$['xml:lang']
                if (this.langs.indexOf(lang) === -1) {
                  this.langs.push(lang)
                }
                units.push({
                  lang,
                  text: tuv.seg.join('').rstrip()
                })
              }
              this.contents.push(units)
            }
          }
        }
      })
    })
  }

  public getLangsInfo(): string[] {
    return this.langs;
  }

  public getLangExists(lang: string): boolean {
    return this.langs.indexOf(lang) !== -1;
  }

  public getSingleText(lang: string): string[] | null {
    const isValidLang = this.getLangExists(lang);
    if (!isValidLang) {
      return null;
    } else {
      const singleLang: string[] = []
      for (const tuset of this.contents) {
        for (const tu of tuset) {
          if (tu.lang === lang) {
            singleLang.push(tu.text)
          }
        }
      }
      return singleLang;
    }
  }

  public getMultipleTexts(langs: string[], onlyFullUnit: boolean = false): string[][] {
    const langs_ = this.getValidLangArray(langs);
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
        if (inTexts.indexOf('') !== -1) {
          texts.push(inTexts)
        }
      } else {
        texts.push(inTexts)
      }
    }
    return texts;
  }

  private getValidLangArray(langs: string[]): string[] {
    return langs.filter(val => {
      return this.getLangExists(val)
    });
  }

}


const sample = './cattest/sample.tmx'
const tmx = new TmxContent()
tmx.loadXmlString(path2ContentStr(sample))
// const ext = tmx.getSingleText('ja')
const exts = tmx.getMultipleTexts(['ja', 'zh-cn'], true)
console.log(exts)