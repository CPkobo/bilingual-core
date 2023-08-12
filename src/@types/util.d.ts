// util
declare interface ReadFailure {
  name: string;
  detail: any;
}

declare interface ErrorMessage {
  isErr: Boolean
  code: string
  name: string
  message: string
}

declare type JsonType = 'extract' | 'diff' | 'cat' | 'tovis'

declare type CountType = 'word' | 'chara' | 'both'

declare interface SimpleContent {
  src: string[][],
  tgt: string[][]
}

declare interface ReadData {
  name: string
  data: string | Buffer
}