import { readFileSync } from 'fs'
import { Csv } from '@coolgk/csv'

export interface Segment {
    [key: string]: string
}

export type Delimiter = ',' | '\t'

export type Quart = '"' | '\''

export type ValidFormart = 'csv' | 'tsv' | 'tovis' | 'xliff' | 'mxliff' | 'tmx' | 'tbx' | 'json' | ''

export class MultilingualConverter {

    static formats: ValidFormart[] = [
        'csv', 'tsv', 'tovis', 'xliff', 'mxliff', 'tmx', 'tbx', 'json'
    ]

    public name: string
    public path: string
    public format: ValidFormart
    public srcLang: string
    public tgtLangs: string[]
    public segs: Segment[]

    constructor() {
        this.name = ''
        this.path = ''
        this.format = ''
        this.srcLang = ''
        this.tgtLangs = [] as string[]
        this.segs = [] as Segment[]
    }

    public readFile(path: string): void {
        this.name = this.path2Name(path)
        this.format = this.path2Format(this.name)
        // const contens = readFileSync(path).toString()
        switch (this.format) {
            case 'csv':
                
            
                break;

            case 'tsv':
                break;
            
            case 'tovis':
                break;

            case 'xliff':
                break;

            case 'mxliff':
                break;

            case 'tmx':
                break;

            case 'tbx':
                break;

            case 'json':
                break;                                                                                                                                                    
            default:
                break;
        }
    }

    public dumpFile(path: string): void {
        const outFormat = this.path2Format(path)
        switch (outFormat) {
            case 'csv':
                
                break;

            case 'tsv':
                break;
            
            case 'tovis':
                break;

            case 'xliff':
                break;

            case 'mxliff':
                break;

            case 'tmx':
                break;

            case 'tbx':
                break;

            case 'json':
                break;                                                                                                                                                    
            default:
                break;
        }
    }

    private path2Format(path: string): ValidFormart {
        const els = path.split('.')
        const format = els[els.length - 1]
        if (format in MultilingualConverter.formats) {
            return format as ValidFormart
        } else {
            return ''
        }
    }

    private path2Name(path: string): string {
        const els = path.replace('\\', '/').split('/')
        return els[els.length - 1]
    }

    private readPlain(path: string, delimiter: Delimiter = ','): void {
        const csv = new Csv()
        const lines = csv.readFile(path, {delimiter})
        lines.forEach((row, index) => {
            console.log(index)
            console.log(row)
        }, () => {})
    }
}