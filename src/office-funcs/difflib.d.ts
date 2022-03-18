
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