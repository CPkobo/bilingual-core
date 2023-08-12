import { readFileSync, writeFileSync } from 'fs'
import { parseString, Builder } from 'xml2js';

type VisitorFunc = (text: string, memo: string) => string

export class XliffProc {
  public srcLang: string
  public tgtLang: string[]
  public contents: TranslationContent[]

  constructor() {
    this.srcLang = ''
    this.tgtLang = [] as string[]
    this.contents = [] as TranslationContent[]
  }

  // **
  public processWithMultilingualXml(path: string, process: ProcessType): Promise<boolean> {
    const extension = path.split('.').pop()
    const xmlStr = readFileSync(path).toString()
    return new Promise((resolve, reject) => {
    switch (extension) {
      case 'xliff':
      case 'mxliff': {
        this.processWithxliffString(process, path, xmlStr)
          .then(() => {
            resolve(true)
          })
          .catch(e => {
            reject(e)
          })
        break
      }

      case 'tmx': {
        this.processWithTmxString(process, path, xmlStr)
          .then(() => {
            resolve(true)
          })
          .catch(e => {
            reject(e)
          })
         break
      }

      case 'tbx': {
        this.processWithTbxString(process, path, xmlStr)
          .then(() => {
            resolve(true)
          })
          .catch(e => {
            reject(e)
          })
        break
      }
    
      default:
        reject('This Program only support "MXLIFF", "XLIFF", "TMX" and "TBX" files')
        break;
    }
  })
  }

  private processWithxliffString(process: ProcessType, xliffName: string, data: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      parseString(data, (err: Error | null, xliff: XliffLoaded) => {
        if (err !== null) {
          reject(err)
        }
        else {
          if (process === 'read') {
            const contents = this.xliffExtract(xliff)
            this.contents = contents
            resolve(true);
          }
          else if (process === 'update') {
            const updated = this.updateXliff(xliff)
            const builder = new Builder()
            const updatedXliff = builder.buildObject(updated)
            writeFileSync(xliffName, updatedXliff)
            resolve(true)
          }
        }
      })
    })
  }

  private xliffExtract(xliff: XliffLoaded): TranslationContent[] {
    const xliffTag = xliff.xliff || [{}];
    const files = xliffTag.file || []
    const contents: TranslationContent[] = []
    files.forEach(file => {
      contents.push(this.xliffFileExtract(file))
    })
    return contents
  }

  private xliffFileExtract(file: XliffFileStructure): TranslationContent {
    const content: TranslationContent = {
      file: file.$.original,
      alllangs: new Set(),
      units: []
    }
    const srcLang = file.$['source-language'] || ''
    content.alllangs.add(srcLang)
    const tgtLang = file.$['target-language'] || ''
    content.alllangs.add(tgtLang)
    const body = file.body[0];
    const tusStruct: XliffTransUnitStructure[][] = 
      body.group ? body.group.map(val => val['trans-unit'])
        : body['trans-unit'] ? [body['trans-unit']]
          : []
    tusStruct.forEach(tus => {
      tus.forEach(tu => {
        const unit: string[] = [
          tu.source[0] || '',
          tu.target[0] || ''
        ]
        content.units.push(unit)
      })
    })
    return content
  }

  private updateXliff(xliff: XliffLoaded): XliffLoaded {
    const xliffTag = xliff.xliff || [{}]
    const files = xliffTag.file || []
    files.forEach((file, index) => {
      const units = this.contents[index].units.reverse()
      const body = file.body[0];
      const tusStruct: XliffTransUnitStructure[][] = 
        body.group ? body.group.map(val => val['trans-unit'])
          : body['trans-unit'] ? [body['trans-unit']]
            : []
      tusStruct.forEach(tus => {
        tus.forEach(tu => {
          const unit = units.pop() || []
          tu.target = unit[1] || ''
        })
      })
    })
    return xliff
  }

  private processWithTmxString(process: ProcessType, name: string, data: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      parseString(data, (err: Error | null, tmx: TmxLoaded) => {
        if (err !== null) {
          console.log(err)
          reject(false)
        } else {
          const content: TranslationContent = {
            file: name,
            alllangs: new Set(),
            units: []
          }
          const header = tmx.tmx.header[0] || {};
          const body = tmx.tmx.body[0] || {};
          if (body.tu.length === 0) {
            reject('empty content')
          } else {
            const headerAttr = header.$
            const srcLang = headerAttr.srclang
            content.alllangs.add(srcLang)
            const langIndexMap: { [lang: string]: number} = {}
            langIndexMap[srcLang] = 0
            const tus = body.tu || []
            for (const tu of tus) {
              const tuvs = tu.tuv || []
              const units: string[] = Array(content.alllangs.size).fill('')
              for (const tuv of tuvs) {
                const lang = tuv.$['xml:lang']
                if (this.tgtLang.indexOf(lang) === -1) {
                  this.tgtLang.push(lang)
                }
                const text = tuv.seg.join('')
                if (text !== '') {
                  units.push(text)
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

  private processWithTbxString(process: ProcessType, name: string, data: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      parseString(data, (err: Error | null, tbx: TbxLoaded) => {
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
            const content: TranslationContent = {
              file: name,
              units: [] as string[][],
              alllangs: new Set()
            }
            for (const termEntry of termEntries) {
              const units: string[] = [];
              for (const langSet of termEntry.langSet) {
                const lang = langSet.$['xml:lang'];
                if (this.tgtLang.indexOf(lang) === -1) {
                  this.tgtLang.push(lang);
                  content.alllangs.add(lang)
                }
                const tig = langSet.tig || [{}];
                const term = tig[0].term || [];
                const text = term.join('');
                if (text !== '') {
                  units.push(text);
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
}