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
  
  declare type TovisMinifyMode = 'CHECK-DUPLI' | 'BILINGUAL'
  
  // s: Source
  // t: Translation
  // m: Machine Translation or Memory, meaning a non-confirmed translation
  // d: Diff data
  // c: Comments
  declare interface TovisBlock {
    s: string;
    t: string;
    m: TransCandidate[];
    u: UsedTerms[];
    d: TovisRef[];
    c: string;
  }
  