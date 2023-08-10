declare type ClassifiedFormat = 'is-word' | 'is-excel' | 'is-ppt' | 'is-pdf' | ''

declare type CountType = 'word' | 'chara' | 'both'

// extract
declare type FileFormat =
  'docx' | 'xlsx' | 'pptx' | 'pdf' |
  'plain' | 'xliff' | 'tmx' | 'tbx' | '';

declare interface ExtractedContent {
  name: string;
  format: FileFormat
  exts: ExtractedText[];
}

declare type SeparateMark =
  'Word-Paragraph' | 'Word-Table' |
  'Excel-Sheet' | 'Excel-Shape' |
  'PPT-Slide' | 'PPT-Note' | 'PPT-Diagram' | 'PPT-Chart' |
  'PDF-Paragraph' | 'PDF-Page' |
  'Plain' | 'Bilingual' | '';

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
  afterRev2?: boolean;
}

declare interface ExcelOption {
  readHiddenSheet?: boolean;
  readFilledCell?: boolean;
}

declare interface PptOption {
  readSlide?: boolean;
  readNote?: boolean;
}

declare interface CatOption {
  locales: string[] | 'all';
  fullset: boolean;
  overWrite: boolean;
}

declare interface OptionQue {
  common?: CommonOption;
  word?: WordOption;
  excel?: ExcelOption;
  ppt?: PptOption
  cat?: CatOption
}
