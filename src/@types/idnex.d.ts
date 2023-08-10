declare type CountType = 'word' | 'chara' | 'both'

declare type ProcessType = 'read' | 'write' | 'update'

// cat
declare interface XliffFileStats {
  name: string
  lines: number
  charas?: number
  words?: number
}

declare interface XliffStats {
  fileNum: number
  locales: string[]
  charas: number
  words: number
  contents: XliffFileStats[]
}

declare type CatDataType = 'XLIFF' | 'TMX' | 'TBX' | ''

declare interface TranslationContent {
  file: string
  alllangs: Set<string>
  // units: TranslationUnit[][]
  units: sring[][]
}

// declare interface TranslationUnit {
//   lang: string
//   text: string
// }


declare interface CatUpdateLog {
  filename: string
  xml: string
  already: string[]
  updated: string[]
  notFounds: string[]
}
