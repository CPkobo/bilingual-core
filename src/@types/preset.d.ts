declare interface PresetOptions {
    mode: import("../util/params").ModeCombinations
    console: boolean
    outputFile: string
    sourceFiles: string | string[]
    targetFiles: string | string[]
    office?: {
        common: CommonOption
        word: WordOption
        excel: ExcelOption
        ppt: PptOption
    }
    cat?: CatOption
    wwc?: WWCRate
    debug: boolean
}