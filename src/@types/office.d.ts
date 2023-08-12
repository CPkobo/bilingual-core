declare type ClassifiedFormat = 'is-word' | 'is-excel' | 'is-ppt' | 'is-pdf' | ''

// extract
declare type FileFormat =
  'docx' | 'xlsx' | 'pptx' | 'pdf' |
  'plain' | 'xliff' | 'tmx' | 'tbx' | '';

declare interface OfficeContent {
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

declare interface OfficeFileStats {
  name: string;
  format: FileFormat;
  doc_para: number;
  doc_table: number;
  xl_sheet: number;
  xl_shape: number;
  ppt_slide: number;
  ppt_dgm: number;
  ppt_note: number;
}
