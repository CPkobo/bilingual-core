declare type ClassifiedFormat = 'is-word' | 'is-excel' | 'is-ppt' | ''

declare type CountType = 'unit' | 'chara'

// CAT
declare type CatDataType = 'XLIFF' | 'TMX' | 'TBX' | ''

declare interface TranslationUnit {
  lang: string,
  text: string,
}


// extract
declare interface ExtractedContent {
  name: string;
  format: 'docx' | 'xlsx' | 'pptx';
  exts: ExtractedText[];
}

declare type SeparateMark = 'Word-Paragraph' | 'Word-Table' | 'Excel-Sheet' | 'Excel-Shape' | 'PPT-Slide' | 'PPT-Note' | 'PPT-Diagram' | 'PPT-Chart';

declare interface ExtractedText {
  type: SeparateMark;
  position: number;
  isActive: boolean;
  value: string[];
  sumCharas: number;
  sumWords: number;
}

declare interface ExcelSubInfoRel {
  main: string;
  sub: string;
}

declare interface PPTSubInfoRel {
  main: string;
  note: string;
  dgm: string;
  chart: string;
}

declare interface WWCRate {
  dupli: number;
  over95: number;
  over85: number;
  over75: number;
  over50: number;
  under49: number;
}

// diff
declare interface WWCInfo extends WWCRate {
  name: string;
  sum: number;
  sum2: number;
}

declare interface WWCReport extends WWCInfo {
  base: WWCRate;
  files: WWCInfo[];
}

declare interface DiffSeg {
  pid: number;
  gid: number;
  file: string;
  st: string;
  tt: string;
  len: number;
  sims: SimilarSegment[];
  max: number;
  maxp: number;
}

declare interface SimilarSegment {
  advPid: number;
  st2: string;
  ratio: number;
  opcode: Opcode[];
}

// オペコードのタイプ。類似分の表示に使用
declare type Opcode = [string, number, number, number, number];

declare type Calcresult = {
  sims: SimilarSegment[];
  max: number;
  maxp: number;
};

// Option
declare interface CommonOption {
  name?: string;
  segmentation?: boolean;
  delimiters?: string;
  excluding?: boolean;
  excludePattern?: string;
  withSeparator?: boolean;
}

declare interface WordOption {
  afterRev?: boolean;
}

declare interface ExcelOption {
  readHiddenSheet?: boolean;
  readFilledCell?: boolean;
}

declare interface PptOption {
  readSlide? : boolean;
  readNote?: boolean;
}

declare interface OptionQue {
  common?: {
    name?: string;
    segmentation?: boolean;
    delimiters?: string;
    excluding?: boolean;
    excludePattern?: string;
    withSeparator?: boolean;
  }
  word?: {
    afterRev?: boolean;
  }
  excel?: {
    readHiddenSheet?: boolean;
    readFilledCell?: boolean;
  }
  ppt?: {
    readSlide? : boolean;
    readNote?: boolean;
  }
}

declare type OnSetString = (text: string, ex: any) => string;
declare type Triger = 'onSetSouce' | 'onSetMT' | 'onQA'

// TOVIS
declare interface TovisPlugin {
  name: string;
  f: OnSetString;
  ex: any;
}

declare interface TovisPluginExternal extends TovisPlugin {
  triger: Triger | Triger[];
}

declare interface ParseResult {
  isOk: boolean;
  message: string;
}

declare interface TovisRef {
  to: number;
  from: number;
  ratio: number;
  op: Opcode[];
}

declare interface TransCandidate {
  type: string;
  text: string;
}

declare type UsedTerms = {
  s: string;
  t: string[];
};

declare interface TovisMeta {
  srcLang: string;
  tgtLang: string;
  files: string[];
  tags: string[];
  // groups: number[][];
  groups: number[];
  remarks: string;
}

// s: Source
// t: Translation
// m: Machine Translation or Memory, meaning a non-confirmed translation
// d: Diff data
// c: COmments
declare interface TovisBlock {
  s: string;
  t: string;
  m: TransCandidate[];
  u: UsedTerms[];
  d: TovisRef[];
  c: string;
}

// util
declare interface ReadFailure {
  name: string;
  detail: any;
}
