import { statSync, readFileSync, writeFileSync, createReadStream } from 'fs'
import { createInterface } from 'readline'

import { DiffInfo, DiffSeg, Opcode } from './diff'
import { CatovisContext, ExtractedText } from './extract'

// export type TovisOpcodeSymbol = '='|'~'|'+'|'-'

// export type TovisOpcode = [string, number, number, number, number]

export interface ParseResult {
    isOk: boolean
    message: string
}

export interface TovisRef {
    to: number
    from: number
    ratio: number
    op: Opcode[]
}

export interface TransCandidate {
    type: string
    text: string
}

export interface TovisMeta {
    srcLang: string,
    tgtLang: string,
    files: string[],
    tags: string[],
    groups: number[][],
    remarks: string,
}

// s: Source 
// t: Translation
// m: Machine Translation or Memory, meaning a non-confirmed translation
// d: Diff data
// c: COmments
export interface TovisBlock {
    s: string
    t: string
    m: TransCandidate[]
    d: TovisRef[]
    c: string
}

export class Tovis {
    meta: TovisMeta
    blocks: TovisBlock[]

    constructor() {
        this.meta = {
            srcLang: '',
            tgtLang: '',
            files: [],
            tags: [],
            groups: [],
            remarks: ''
        }
        this.blocks = []
    }

    public parseFromFile(path: string, fileType: 'tovis' | 'diff' | 'plain'): Promise<ParseResult> {
        // const fs = require('fs')
        return new Promise((resolve, reject) => {
            try {
                statSync(path)
                if (fileType === 'tovis') {
                    this.parseFromTovis(path).then((message) => {
                        resolve({
                            isOk: true,
                            message
                        })
                    }).catch((errMessage) => {
                        reject({
                            isOk: false,
                            message: errMessage
                        })
                    })
                }

                else if (fileType === 'diff') {
                    const diffStr = readFileSync(path).toString()
                    this.parseDiffInfo(JSON.parse(diffStr)).then((message) => {
                        resolve({
                            isOk: true,
                            message
                        })
                    }).catch((errMessage) => {
                        reject({
                            isOk: false,
                            message: errMessage
                        })
                    })
                }

                else if (fileType === 'plain') {
                    console.log('under development')
                }

                else {
                    reject({
                        isOk: false,
                        message: 'fileType sholud designate from "tovis"/"diff"/"plain"'
                    })
                }
            } catch {
                reject({
                    isOk: false,
                    message: 'file did not found'
                })
            }
        })
    }

    public parseFromObj(data: CatovisContext | DiffInfo) {
        if (data instanceof CatovisContext) {
            // 
        } else if (data instanceof DiffInfo) {
            this.parseDiffInfo(data.dsegs)
        }

    }

    public dump(): string[] {
        const tovisStr: string[] = [
            `#SourceLang: ${this.meta.srcLang}`,
            `#TargetLang: ${this.meta.tgtLang}`,
            `#IncludingFiles: ${this.meta.files.join(',')}`,
            `#Tags: ${this.meta.tags.join(',')}`,
        ]
        let groupsStr: string[] = []
        for (const group of this.meta.groups) {
            groupsStr.push(`${group[0]}-${group[1]}`)
        }
        tovisStr.push(`#Groups: ${groupsStr.join(',')}`)
        if (this.meta.remarks !== '') {
            tovisStr.push(`#Remarks: ${this.meta.remarks}`)
        }
        tovisStr.push('-----\n')
        for (let i = 0; i < this.blocks.length; i++) {
            tovisStr.push(`@:${i+1}} ${this.blocks[i].s}`)
            tovisStr.push(`λ:${i+1}} ${this.blocks[i].t}`)
            if (this.blocks[i].m.length > 0) {
                for (const tmmt of this.blocks[i].m) {
                    tovisStr.push(`_:${i+1}}[${tmmt.type}] ${tmmt.text}`)
                }
            }
            const refs: string[] = []
            for (const d of this.blocks[i].d) {
                let ref: string = `${d.from}>${d.to}|${d.ratio}`
                for (const op of d.op) {
                    ref += `|${op.join(',')}`
                }
                refs.push(ref)
            }
            tovisStr.push(`^:${i+1}} ${refs.join(';')}`)
            tovisStr.push(`!:${i+1}} ${this.blocks[i].c}`)
            tovisStr.push('')
        }
        return tovisStr
    }

    public dumpToJson(): string {
        return JSON.stringify(this, null, 2)
    }

    private createBlock(): TovisBlock {
        return {
            s: '',
            t: '',
            m: [],
            d: [],
            c: ''
        }
    }

    private createRef(): TovisRef {
        return {
            from: 0,
            to: 0,
            ratio: 0,
            op: [],
        }
    }

    private createOpcodes(codes: string[]): Opcode[] {
        const opcodes: Opcode[] = []
        for (const code of codes) {
            const eachChara = code.split(',')
            opcodes.push([
                eachChara[0],
                Number(eachChara[1]),
                Number(eachChara[2]),
                Number(eachChara[3]),
                Number(eachChara[4]),
            ])
        }
        return opcodes
    }

    private parseFromTovis(path: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const rs = createReadStream(path)
            const lines = createInterface(rs)
            let count: number = 1;
            const lineHead = new RegExp('^(@|λ|_|\\^|\\!)+:(\\d+)}\\s?')
            // const blocks: TovisBlock[] = []
            lines.on('line', (line) => {
                if (line.startsWith('#')) {
                    const metaData = line.split(':')
                    if (metaData.length > 1) {
                        switch (metaData[0]) {
                            case '#SourceLang':
                                this.meta.srcLang = metaData[1].trim()
                                count++
                                break;
                            case '#TargetLang':
                                this.meta.tgtLang = metaData[1].trim()
                                count++
                                break;
                            case '#IncludingFiles':
                                this.meta.files = metaData[1].trim().split(',')
                                count++
                                break;
                            case '#Tags':
                                this.meta.tags = metaData[1].trim().split(',')
                                count++
                                break;
                            case '#Groups':
                                const byGroups = metaData[1].trim().split(',')
                                for (const byGroup of byGroups) {
                                    const fromAndTo = byGroup.split('-')
                                    if (fromAndTo.length >= 2) {
                                        this.meta.groups.push([Number(fromAndTo[0]), Number(fromAndTo[1])])
                                    }
                                }
                                count++
                                break
                            
                            case '#Remarks':
                                this.meta.remarks +=  `${metaData[1]};`
                                count++
                        
                            default:
                                break;
                        }
                    } else {
                        this.meta.remarks += `${line};`
                        count++
                    }
                } else if (line !== '') {
                    const matchObj: RegExpMatchArray | null = line.match(lineHead)
                    if (matchObj !== null) {
                        const index = Number(matchObj[2])
                        while(this.blocks.length < index) {
                            this.blocks.push(this.createBlock())
                        }
                        this.upsertBlocks(line.substr(0,1), index, line.replace(lineHead, '').trim())
                        count++
                    }
                }
            })
            lines.on('close', () => {
                resolve(`success to read ${count} rows`)
            })
        })
    }

    private parseDiffInfo(diff: DiffSeg[]): Promise<string> {
        return new Promise((resolve, reject) => {
            const codeDict = {
                replace: '~',
                delete: '-',
                insert: '+',
            }
            for (const dseg of diff) {
                const block = this.createBlock()
                block.s = dseg.text
                for (const sim of dseg.sims) {
                    const refInfo: TovisRef = {
                        from: sim.advPid,
                        to: dseg.pid,
                        ratio: sim.ratio,
                        op: sim.opcode.filter((c: Opcode) => {
                            return c[0] !== 'equal'
                        }).map((c2: Opcode) => {
                            const mark = c2[0] === 'replace' ? '~' : c2[0] === 'delete' ? '-' : '+'
                            return [mark, c2[1], c2[2], c2[3], c2[4]]
                        })
                    }
                    block.d.push(refInfo)
                    this.blocks[sim.advPid - 1].d.push(refInfo)
                }
                this.blocks.push(block)
            }
            resolve('DiffInfo successfully parsed into TOVIS')
        })
    }

    private upsertBlocks(keyChara: string, index: number, contents: string): boolean {
        let isValid: boolean = false
        switch(keyChara) {
            case '@': {
                if (contents !== '') {
                    if (this.blocks[index - 1].s === '') {
                        this.blocks[index - 1].s = contents
                        isValid = true
                    }
                } else {
                    isValid = true
                }
                break
            }

            case 'λ': {
                if (contents !== '') {
                    if (this.blocks[index - 1].t === '') {
                        this.blocks[index - 1].t = contents
                        isValid = true
                    }
                } else {
                    isValid = true
                }
                break
            }

            case '_': {
                if (contents !== '') {
                    const matchObj: RegExpMatchArray | null = contents.match(/^\[.+\]/)
                    if (matchObj === null) {
                        this.blocks[index - 1].m.push({type: 'Hm?', text: contents})
                    } else {
                        this.blocks[index - 1].m.push({
                            type: matchObj[0].replace('[', '').replace(']', ''),
                            text: contents.replace(matchObj[0], '')
                        })
                    }
                }
                isValid = true 
                break
            }
            case '!': {
                if (contents !== '') {
                    this.blocks[index - 1].c += contents + ';'
                }
                isValid = true
                break
            }
            case '^': {
                if (contents !== '') {
                    if (this.blocks[index - 1].d.length === 0) { 
                        const refs: TovisRef[] = []
                        const singleCodes = contents.split(';')
                        for (const singleCode of singleCodes) {
                            const elements = singleCode.split('|')
                            const fromAndTo = elements[0].split('>')
                            if (fromAndTo.length < 2) {
                                isValid = false
                                break
                            }
                            const ref: TovisRef = {
                                from: Number(fromAndTo[0]),
                                to: Number(fromAndTo[1]),
                                ratio: Number(elements[1]),
                                op: this.createOpcodes(elements.slice(2))
                            }
                            refs.push(ref)
                            // blocks[ref.from - 1].d.push(ref)
                        }
                        this.blocks[index - 1].d = refs
                        isValid = true
                    }
                } else {
                    isValid = true
                }
                break
            }

            default:
                break
        }
        return isValid
    }
}