
// SequenceMatcher
declare type Match = [number, number, number]
declare type Queue = [number, number, number, number]

declare type IsJunk = (chara: string) => boolean

declare interface EltCount {
    [key: string]: number
}

declare interface EltIndices {
    [key: string]: number[]
}

declare interface J2Len {
    [key: number]: number
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
    fid: number;
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
  declare type Optag =
    'equal' | 'insert' | 'delete' | 'replace' |
    '=' | '+' | '-' | '~' | ''
  declare type Opcode = [Optag, number, number, number, number];
  
  declare type Calcresult = {
    sims: SimilarSegment[];
    max: number;
    maxp: number;
  };