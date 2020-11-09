import { readFileSync, readdirSync, statSync, writeFileSync } from 'fs'

import { ExtractedContent, ExtractedText,
        CatovisContext } from './cli-funcs/extract'
import { ReadingOption, OptionQue} from './cli-funcs/option'
import { DiffInfo, DiffSeg } from './cli-funcs/diff'
import { FileStats } from './cli-funcs/stats'
import { Tovis } from './cli-funcs/tovis'

import { docxReader } from './cli-funcs/office/docxReader'
import { xlsxReader } from './cli-funcs/office/xlsxReader'
import { pptxReader } from './cli-funcs/office/pptxReader'

import { cnm, ReadFailure } from './cli-funcs/util'

export function pathContentsReader(paths: string[], opq?: OptionQue): Promise<ExtractedContent[]> {
    const que = opq !== undefined ? opq : {}
    const opt = new ReadingOption(que)
    return new Promise((resolve, reject) => {
        const prs: Promise<any>[] = []
        for (const path of paths) {
            const read = readFileSync(path);
            if (path.endsWith('.docx')) {
                prs.push(docxReader(read, path, opt))
            } else if (path.endsWith('.xlsx')) {
                prs.push(xlsxReader(read, path, opt))
            } else if (path.endsWith('.pptx')) {
                prs.push(pptxReader(read, path, opt))
            }
        }
        Promise.all(prs).then(res => {
            resolve(res)
        }).catch((failure: ReadFailure) => {
            reject(failure)
        })
    })
}

const modeChoices = ['EXTRACT', 'ALIGN', 'COUNT', 'DIFF', 'TOVIS']

class CLIParams {
    public validated: boolean

    public mode: 'EXTRACT' | 'ALIGN' | 'COUNT' | 'DIFF' | 'TOVIS'
    public source: string
    public target: string
    public sFiles: string[]
    public tFiles: string[]
    public oMode: 'json' | 'plain' | 'console' | ''
    public oFile: string

    public excluding: boolean
    public exclusion: string
    public wordRev: boolean
    public withSeparator: boolean
    public pptNote: boolean
    public excelReadHidden: boolean
    public excelReadFilled: boolean

    constructor(args: any) {
        this.sFiles = []
        this.tFiles = []
        this.validated = false

        if (args.mode !== undefined && modeChoices.indexOf(args.mode) !== -1) {
            this.mode = args.mode
        } else {
            this.mode = 'EXTRACT'
        }
        if (args.args !== undefined && args.args[0] !== undefined) {
            this.source = args.args[0]
        } else if (args.source !== undefined) {
            this.source = args.source !== '' ? args.source : './'
        } else {
            this.source = './'
        }
        if (args.target !== undefined) {
            this.target = args.target !== '' ? args.target : './'
        } else {
            this.target = './'
        }
        this.oFile = args.output !== undefined ? args.output : ''

        if (this.oFile === undefined) {
            this.oMode = 'console' 
        } else if (this.oFile.endsWith('.json')) {
            this.oMode = 'json'
        } else if (this.oFile.endsWith('.txt') || this.oFile.endsWith('.tsv')) {
            this.oMode = 'plain'
        } else {
            this.oMode = 'console'
        }

        this.excluding = args.exclusion === undefined
        this.exclusion = args.exclusion !== undefined ? args.exclusion : ''
        this.wordRev = true
        this.withSeparator = true
        this.pptNote = true
        this.excelReadHidden = true
        this.excelReadFilled = true
        
        const others: string[] = args.others !== undefined ? args.others.split(','): []
        for (let other of others) {
            other = other.toLowerCase()
            switch (other) {
                case 'without-separator':
                case 'wosep':
                    this.withSeparator = false

                case 'word-before-rev':
                case 'norev':
                    this.wordRev = false
                    break

                case 'ppt-note':
                case 'note':
                    this.pptNote = false
                    break

                case 'excel-hidden-sheet':
                case 'hide':
                    this.excelReadHidden = false
                    break
                    
                case 'excel-filled-cell':
                case 'filled':
                    this.excelReadFilled = false
                    break

                case 'debug':
                    this.oMode = ''
                    break
                
                default:
                    break
            }
        }
    }

    public updateFromDialog(ans: any): void {
        this.mode = ans.mode
        this.excluding = ans.exclusion !== ''
        this.exclusion = ans.exclusion
        this.withSeparator = ans.withSeparator
        this.source = ans.source !== '' ? ans.source : './'
        if (ans.target !== undefined) {
            this.target = ans.target !== '' ? ans.target : './'
        }
        switch (this.mode) {
            case 'EXTRACT':
                if (ans.outputFile === undefined || ans.outputFile === '') {
                    this.oFile = ''
                    this.oMode = 'console'
                } else if (ans.outputFile.endsWith('.txt')) {
                    this.oFile = ans.outputFile
                    this.oMode = 'plain'
                } else if (ans.outputFile.endsWith('.json')) {
                    this.oFile = ans.outputFile
                    this.oMode = 'json'
                } else {
                    this.oFile = ans.outputFile + '.txt'
                    this.oMode = 'plain'
                }
                break

            case 'ALIGN':
                if (ans.outputFile === undefined || ans.outputFile === '') {
                    this.oFile = ''
                    this.oMode = 'console'
                } else if (ans.outputFile.endsWith('.tsv')) {
                    this.oFile = ans.outputFile
                    this.oMode = 'plain'
                } else if (ans.outputFile.endsWith('.json')) {
                    this.oFile = ans.outputFile
                    this.oMode = 'json'
                } else {
                    this.oFile = ans.outputFile + '.tsv'
                    this.oMode = 'plain'
                }
                break
                
            case 'COUNT':
                if (ans.outputFile === undefined || ans.outputFile === '') {
                    this.oFile = ''
                    this.oMode = 'console'
                } else if (ans.outputFile.endsWith('.tsv')) {
                    this.oFile = ans.outputFile
                    this.oMode = 'plain'
                } else if (ans.outputFile.endsWith('.json')) {
                    this.oFile = ans.outputFile
                    this.oMode = 'json'
                } else {
                    this.oFile = ans.outputFile + '.tsv'
                    this.oMode = 'plain'
                }
                break
                
            case 'DIFF':
                if (ans.outputFile === undefined || ans.outputFile === '') {
                    this.oFile = ''
                    this.oMode = 'console'
                } else if (ans.outputFile.endsWith('.json')) {
                    this.oFile = ans.outputFile
                    this.oMode = 'json'
                } else {
                    this.oFile = ans.outputFile + '.json'
                    this.oMode = 'json'
                }
                break

            case 'TOVIS':
                if (ans.outputFile === undefined || ans.outputFile === '') {
                    this.oFile = ''
                    this.oMode = 'console'
                } else if (ans.outputFile.endsWith('.tovis')) {
                    this.oFile = ans.outputFile
                    this.oMode = 'plain'
                } else if (ans.outputFile.endsWith('.json')) {
                    this.oFile = ans.outputFile
                    this.oMode = 'json'
                } else {
                    this.oFile = ans.outputFile + '.tovis'
                    this.oMode = 'plain'
                }
                break
            default:
                break
        }
        
        for (const other of ans.others) {
            switch (other) {
                case 'Dont add separation marks':
                    this.withSeparator = false
                    break

                case 'Word-Before-Revision':
                    this.wordRev = false
                    break

                case 'PPT-Note':
                    this.pptNote = false
                    break

                case 'Excel-Hidden-Sheet':
                    this.excelReadHidden = false
                    break
                    
                case 'Excel-Filled-Cell':
                    this.excelReadFilled = false
                    break

                case 'DEBUG':
                    this.oMode = ''
                    break
                
                default:
                    break
            }
        }
    }

    public executeByParams(): void {
        const err = this.validate()
        if (err !== '') {
            cnm(`Validation Error: ${err}`)
            return
        }
        // cnm(JSON.stringify(this, null, 2))
        const opt: OptionQue = this.exportAsOptionQue()
        console.log('------------------------')
        const prs: Promise<ExtractedContent[]>[] = []
        prs.push(pathContentsReader(this.sFiles, opt))
        if (this.mode === 'ALIGN') {
            prs.push(pathContentsReader(this.tFiles, opt))
        }
        Promise.all(prs).then((ds: ExtractedContent[][]) => {
            const cxt = new CatovisContext()
            const diff = new DiffInfo()
            switch(this.mode) {
                case 'EXTRACT':
                    cxt.readContent(ds[0])
                    this.cliOutlet('EXTRACT', opt, this.oMode, this.oFile, { cxt })
                    break
    
                case 'COUNT':
                    diff.analyze(ds[0])
                    diff.calcWWC('chara')
                    this.cliOutlet('COUNT', opt, this.oMode, this.oFile, { diff })
                    break
    
                case 'DIFF':
                    diff.analyze(ds[0])
                    this.cliOutlet('DIFF', opt, this.oMode, this.oFile, { diff })
                    break
    
                case 'ALIGN':
                    cxt.readContent(ds[0], ds[1])
                    this.cliOutlet('ALIGN', opt, this.oMode, this.oFile, { cxt })
                    break
    
                case 'TOVIS':
                    diff.analyze(ds[0])
                    this.cliOutlet('TOVIS', opt, this.oMode, this.oFile, { diff })
                    break
    
                default:
                    break
            }
        }).catch((failure: ReadFailure) => {
            console.log(`Error occured at ${failure.name}`)
            console.log('--------For more details, please see below-----------')
            console.log(failure.detail)
            console.log('-----------------------------------------------------')
        })
    }
        
    private async cliOutlet(
        eMode: 'EXTRACT' | 'ALIGN' | 'COUNT' | 'DIFF' | 'TOVIS' | 'DEBUG',
        opt: OptionQue, oMode: 'json' | 'plain' | 'console' | '' ,
        oFile: string, data: {cxt?: CatovisContext, diff?: DiffInfo}
        ): Promise<void> {
    
        let result: string[] = []
        switch (eMode)  {
            case 'EXTRACT':
                if (data.cxt !== undefined) {
                    if (oMode === 'json') {
                        result = [JSON.stringify(data.cxt.getRawContent('src'), null, 2)]
                    } else {
                        result = await data.cxt.getSingleText('src', opt)
                    }
                }
                break

            case 'ALIGN':
                if (data.cxt !== undefined) {
                    result = await data.cxt.getAlignedText(opt)
                }
                break

            case 'COUNT':
                if (data.diff !== undefined) {    
                    const format = oMode === 'json' ? 'json' : 'human'
                    result = [data.diff.exportResult('wwc-chara', format)]
                }
                break

            case 'DIFF':
                if (data.diff !== undefined) {
                    result = [data.diff.exportResult("diff", "json")]
                }
                break

            case 'TOVIS':
                const tovis = new Tovis()
                if (data.diff !== undefined) {
                    tovis.parseDiffInfo(data.diff.dsegs)
                    if (oFile.endsWith('tovis')) {
                        result = tovis.dump()
                    } else {
                        result = [tovis.dumpToJson()]
                    }
                }
                break
        }
        switch (oMode) {
            case 'console':
                console.log(result.join('\n'))
                break

            case 'json':
            case 'plain':
                writeFileSync(`./${oFile}`, result.join('\n'))
                break

            default:
                break
        }
    }

    public exportAsOptionQue(): OptionQue {
        return {
            name: 'via-cli',
            withSeparator: this.withSeparator,
            excluding: this.excluding,
            exclusion: this.exclusion, 
            segmentation: true,
            delimiters: '(\\。|\\. |\\! |\\? |\\！|\\？)',
            wordRev: this.wordRev,
            excelReadHidden: this.excelReadHidden,
            excelReadFilled: this.excelReadFilled,
            pptNote: this.pptNote
        }
    }

    private validate(): string {
        let errMes = ''
        this.validated = true
        const isSourceOk = this.convertIntoFiles('source')
        if (!isSourceOk) {
            errMes += 'Source Files Error; '
        }
        const isTargetOK = this.mode === 'ALIGN' ? this.convertIntoFiles('target') : true
        if (!isTargetOK) {
            errMes += 'Target Files Error; '
        }
        if (this.mode === 'ALIGN' && this.sFiles.length !== this.tFiles.length) {
            errMes += 'ALIGN File Number Error; '
        }
        if (this.mode === 'EXTRACT' && this.oFile.endsWith('.tsv')) {
            this.oFile = this.oFile.replace('.tsv', '.txt')
        }
        if (this.mode === 'ALIGN' && this.oFile.endsWith('.txt')) {
            this.oFile = this.oFile.replace('.txt', '.tsv')
        }
        return errMes
    }

    private convertIntoFiles(srcOrTgt: 'source' | 'target'): boolean {
        const oooxml = ['.docx', '.xlsx', '.pptx']
        const isWhich = srcOrTgt === 'source' ? this.source : this.target;
        const toWhich = srcOrTgt === 'source' ? this.sFiles : this.tFiles;
        const files = isWhich.split(',')
        for (const f of files) {
            try {
                const stat = statSync(f)
                if (stat.isDirectory()) {
                    const dirName = f.replace('\\', '').endsWith('/') ? f : `${f}/`
                    const clds = readdirSync(f)
                    for (const cld of clds) {
                        if (oooxml.indexOf(cld.substr(-5, 5)) !== -1) {
                            toWhich.push(`${dirName}${cld}`)
                        }    
                    }
                } else {
                    if (oooxml.indexOf(f.substr(-5, 5)) !== -1) {
                        toWhich.push(f)
                    }
                }
            } catch {
                console.log(`${f} does not exist`)
                return false
            }
        }
        if (toWhich.length === 0) {
            console.log('No Valid File')
            return false
        } else {
            return true
        }
    }
}

function inquirerDialog(sourceFiles?: string) {
    console.log('CATOVIS Dialog Interface')
    const params = new CLIParams({})
    const inquirer = require('inquirer');
    const prompts = [
        {
            type: 'list',
            name: 'mode',
            message: 'Select Execution Mode.',
            choices: ['EXTRACT', 'ALIGN', 'COUNT', 'DIFF', 'TOVIS']
        },
        {
            name: 'source',
            message: 'Source input file(s)/folder(s) with comma separated. Remain blank for current directory',
            when: (): boolean => {
                return sourceFiles === undefined
            }
        },
        {
            name: 'target',
            message: 'Target input file(s)/folder(s) with comma separated.',
            when: (answerSoFar: any) : boolean => {
                return answerSoFar.mode === 'ALIGN'
            }
        },
        {
            name: 'outputFile',
            message: (answerSoFar: any) : string => {
                let mes: string = 'Output file name. '
                switch (answerSoFar.mode) {
                    case 'EXTRACT':
                        mes += 'Able to use ".txt"(implicit) or ".json", output to "console" if blank.'
                        break

                    case 'ALIGN':
                        mes += 'Able to use ".tsv"(implicit) or ".json", output to "console" if blank.'
                        break

                    case 'COUNT':
                        mes += 'Able to use ".tsv"(implicit), output to "console" if blank.'
                        break
                    
                    case 'DIFF':
                        mes += 'Able to use ".json"(implicit), output to "console" if blank.'
                        break
                    
                    case 'DIFF':
                        mes += 'Able to use ".tovis"(implicit), output to "console" if blank.'
                        break
                
                    default:
                        break
                }
                return mes
            }
        },
        {
            name: 'exclusion',
            message: 'Input RegExp string for excluding from result.'
        },
        {
            type: 'checkbox',
            name: 'others',
            message: 'Designate other options(Multiple select with space bar).',
            choices: ['Dont add separation marks', 'Word-Before-Revision', 'PPT-Note', 'Excel-Hidden-Sheet', 'Excel-Filled-Cell', 'DEBUG']
        },
    ]
    inquirer.prompt(prompts).then((answer: any) => {
        // cnm(answer)
        if (sourceFiles !== undefined) {
            answer.source = sourceFiles
        }
        params.updateFromDialog(answer)
        params.executeByParams()
    })
}

// #起動時に処理される部分
console.log('------------------------')
const program = require('commander')
program
    .option('-c, --cmd', 'Use full CLI when true. Default value is "false"', false)
    .option('-m, --mode <item>', 'Select Execution Mode. Choose From "EXTRACT" | "ALIGN" | "COUNT" | "DIFF" | "TOVIS"')
    .option('-s, --source <item>', 'Source input file(s)/folder(s) with comma separated. You can input directly without option. Remain blank for current directory')
    .option('-t, --target <item>', 'Target input file(s)/folder(s) with comma separated.')
    .option('-i, --input <item>', 'A txt file which lists the input file. Currently not provided yet')
    .option('-o, --output <item>', 'Designate output file name with extension. Format can be selected from json, txt or tsv. Use standard output when blank')
    .option('-e, --exclusion <item>', 'RegExp string for excluding from result. The expression "^" and "$" will be automaticaly added.')
    .option('-w, --withSeparator', 'Use separation marks in out file. Default value is "true"', true)
    .option('--others <item>',
        'Designate "Without-Separator(or wosep) | Word-Before-Rev(or norev) |PPT-Note(or note) | Excel-Hidden-Sheet(or hide) | Excel-Filled-Cell(or filled) | DEBUG". Multiple selection with comma.')

const args: any = program.parse(process.argv)

if (args.cmd === false) {
    if (args.args.length !== 0) {
        inquirerDialog(args.args[0])
    } else {
        inquirerDialog()
    }
} else {
    const params = new CLIParams(args)
    params.executeByParams()
}