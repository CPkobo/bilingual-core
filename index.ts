import { readFileSync, readdirSync, statSync, writeFileSync } from 'fs';
import { load } from 'js-yaml'

import { ExtractContext } from './office-funcs/extract';
import { ReadingOption } from './office-funcs/option';
import { DiffInfo } from './office-funcs/diff';
// import { FileStats } from './office-funcs/stats';
import { Tovis } from './office-funcs/tovis';
import { CatDataContent } from './office-funcs/cats';

// import { cnm, pathContentsReader, ReadFailure } from './office-funcs/util';
import { pathContentsReader, path2ContentStr, createTsvArray } from './office-funcs/util-sv'
import { path2Format, path2Name, path2Dir, countFromDoubleArray } from './office-funcs/util';

type ModeLarge = 'OFFICE' | 'COUNT' | 'CAT' | 'DEFAULT PRESET'

type ModeMiddleOffice = 'EXTRACT txt' | 'ALIGN tsv' | 'EXTRACT json' | 'EXTRACT-DIFF json' | 'EXTRACT-DIFF tovis' | 'EXTRACT-DIFF min-tovis'
type ModeMiddleCount = 'CHARAS tsv' | 'WORDS tsv' | 'DIFF-CHARAS tsv' | 'DIFF-WORDS tsv'
type ModeMiddleCat = 'EXTRACT tsv' | 'EXTRACT-DIFF json' | 'EXTRACT-DIFF tovis' | 'EXTRACT-DIFF min-tovis' |'UPDATE xliff' | 'REPLACE xliff'


// とり得る値としてのタイプ
type ModeOption =
  'OFFICE:EXTRACT txt' | 'OFFICE:EXTRACT json' |
  'OFFICE:EXTRACT-DIFF json' | 'OFFICE:EXTRACT-DIFF tovis' | 'OFFICE:EXTRACT-DIFF min-tovis' |
  'OFFICE:ALIGN tsv' |
  'COUNT:CHARAS tsv' | 'COUNT:WORDS tsv' | 'COUNT:DIFF-CHARAS tsv' | 'COUNT:DIFF-WORDS tsv' |
  'CAT:EXTRACT tsv' | 'CAT:EXTRACT-DIFF json' | 'CAT:EXTRACT-DIFF tovis' | 'CAT:EXTRACT-DIFF min-tovis' |
  'CAT:UPDATE xliff' | 'CAT:REPLACE xliff'

const officeModes: ModeMiddleOffice[] = [
  'EXTRACT txt', 'ALIGN tsv', 'EXTRACT json', 'EXTRACT-DIFF json', 'EXTRACT-DIFF tovis', 'EXTRACT-DIFF min-tovis'
]
const countModes: ModeMiddleCount[] = [
  'CHARAS tsv', 'WORDS tsv', 'DIFF-CHARAS tsv', 'DIFF-WORDS tsv'
]
const catModes: ModeMiddleCat[] = [
  'EXTRACT tsv', 'EXTRACT-DIFF json', 'EXTRACT-DIFF tovis', 'EXTRACT-DIFF min-tovis', 'UPDATE xliff', 'REPLACE xliff'
]

// 初期設定値とともにオプション項目を管理するクラス
// 主要な機能は以下のとおり
// 1. コンストラクタ
// - 引数を受け取ると、指定項目のみを変更する
// 2. OptionQue にあった形で設定をエクスポートする
// 3. ダイアログで入力した項目をもとに、指定項目を再設定する
// 4. オプション項目をもとに、処理を実行する
// - ファイルパスの検証等は、実行時に行われる

class CLIController {
  // validateメソッドで、ファイルパスにすべて問題がないと判断されたら true になる
  private validated: boolean;

  private mode: {
    lg: ModeLarge,
    md: ModeMiddleOffice | ModeMiddleCount | ModeMiddleCat,
    format: string,
    console: boolean,
    debug: boolean,
  }

  private source: string;
  private target: string;
  private outputFile: string;
  private srcFiles: string[];
  private tgtFiles: string[];

  // Officeの抽出に関係するオプション項目
  // ReadingOptionの各項目に対応している
  private officeOptions: {
    common: CommonOption,
    word: WordOption,
    excel: ExcelOption,
    ppt: PptOption
  }

  // CATの処理に関するオプション項目
  private catOptions: {
    locales: string[] | 'all';
    fullset: boolean;
    overWrite: boolean;
  }

  private WWCOption: WWCRate;

  constructor() {
    // 初期値の設定を行う
    this.validated = false;

    this.mode = {
      lg: 'OFFICE',
      md: 'EXTRACT txt',
      format: 'txt',
      console: false,
      debug: false,
    }

    // 原稿ファイルの場所
    // 既定値はルート
    this.source = './'
    this.target = './'
    this.srcFiles = [];
    this.tgtFiles = [];
    this.outputFile = './'

    this.officeOptions = {
      common: {
        name: 'via-cli',
        withSeparator: true,
        excluding: false,
        excludePattern: '',
        segmentation: true,
        delimiters: '(。|！|？|(\\. )|(\\! )|(\\? ))',
      },
      word: {
        afterRev: true,
      },
      excel: {
        readHiddenSheet: false,
        readFilledCell: true,
      },
      ppt: {
        readNote: true,
      }
    }
    this.catOptions = {
      locales: 'all',
      fullset: false,
      overWrite: false,
    }

    this.WWCOption = {
      dupli: 1,
      over95: 1,
      over85: 1,
      over75: 1,
      over50: 1,
      under49: 1,
    }
  }

  public exportAsOptionQue(): OptionQue {
    return this.officeOptions
  }

  public getSettingInfo(): string {
    if (!this.validated) {
      this.validate()
    }
    const info = {
      validated: this.validated,
      mode: this.mode,
      source: this.source,
      target: this.target,
      outputFile: this.outputFile,
      srcFiles: this.srcFiles,
      tgtFiles: this.tgtFiles,
      office: this.officeOptions,
      cat: this.catOptions,
      wwc: this.WWCOption,
    }
    return JSON.stringify(info, null, 2)
  }

  public setMode1(mode: string | undefined | null): boolean {
    if (mode === undefined || mode === null) {
      return false
    } else {
      const modes = mode.split(':')
      switch (modes[0] as ModeLarge) {
        case 'OFFICE': 
          this.mode.lg = 'OFFICE'
          this.mode.md = modes[1] as ModeMiddleOffice
          console.log(modes[1].lastIndexOf(' ') + 1)
          if (this.mode.md !== 'EXTRACT-DIFF min-tovis') {
            this.mode.format = modes[1].substr(modes[1].lastIndexOf(' ') + 1)
          } else {
            this.mode.format = 'mtovis'
          }
          return true

        case 'COUNT': 
          this.mode.lg = 'COUNT'
          this.mode.md = modes[1] as ModeMiddleCount
          return true

        case 'CAT':
          this.mode.lg = 'CAT'
          this.mode.md = modes[1] as ModeMiddleCat
          if (this.mode.md !== 'EXTRACT-DIFF min-tovis') {
            this.mode.format = modes[1].substr(modes[1].lastIndexOf(' ') + 1)
          } else {
            this.mode.format = 'mtovis'
          }
          return true

        default:
          return false;
      }
    }
  }

  public setMode2(
    modeLg: ModeLarge | undefined | null,
    modeMd: ModeMiddleOffice | ModeMiddleCat | undefined | null) {
    if (modeLg === undefined || modeLg === null ||
      modeMd === undefined || modeMd === null) {
      return false
    } else {
      this.mode.lg = modeLg;
      this.mode.md = modeMd;
      if (this.mode.md !== 'EXTRACT-DIFF min-tovis') {
        this.mode.format = this.mode.md.substr(this.mode.md.lastIndexOf(' ') + 1)
      } else {
        this.mode.format = 'mtovis'
      }
      return true
    }
  }

  public setConsole(console: boolean | string | undefined | null): boolean {
    if (console === undefined || console === null) {
      return false
    } else if (typeof console === 'string') {
      this.mode.console = console === 'true';
      return true
    } else {
      this.mode.console = console;
      return true
    }
  }

  public setDebug(debug: boolean | undefined | null): boolean {
    if (debug !== undefined && debug !== null) {
      this.mode.debug = debug;  
    }
    return true
  }

  public setSource(src: string | string[] | undefined | null): boolean {
    if (src !== undefined && src !== null) {
      if (typeof src === 'string') {
        this.source = src
      } else {
        this.source = src.join(',')
      }
    }
    return this.setFilesArray('source')
  }

  public setTarget(tgt: string | string[] | undefined | null): boolean {
    if (tgt !== undefined && tgt !== null) {
      if (typeof tgt === 'string') {
        this.target = tgt
      } else {
        this.target = tgt.join(',')
      }
    }
    return this.setFilesArray('target')
  }

  public setOutputFile(name: string | undefined | null): boolean {
    if (name === undefined || name === null) {
      return false
    } else {
      if (name !== '') {
        this.outputFile = name
      } else {
        this.outputFile = `./catovis.${this.mode.format}`
      }
      return true
    }
  }

  public setOfficeOptions(opt: OptionQue | undefined | null): boolean {
    if (opt === undefined || opt === null) {
      return false
    } else {
      if (opt.common !== undefined) {
        if (opt.common.withSeparator !== undefined) {
          this.officeOptions.common.withSeparator = opt.common.withSeparator;
        }
        if (opt.common.excludePattern !== undefined && opt.common.excludePattern !== '') {
          this.officeOptions.common.excluding = true;
          this.officeOptions.common.excludePattern = opt.common.excludePattern;
        }
        if (opt.common.segmentation !== undefined) {
          this.officeOptions.common.segmentation = opt.common.segmentation;
        }
        if (opt.common.delimiters !== undefined && opt.common.delimiters !== '') {
          this.officeOptions.common.delimiters = opt.common.delimiters;
        }
      }
      if (opt.word !== undefined) {
        if (opt.word.afterRev !== undefined) {
          this.officeOptions.word.afterRev = opt.word.afterRev;
        }
      }
      if (opt.excel !== undefined) {
        if (opt.excel.readHiddenSheet !== undefined) {
          this.officeOptions.excel.readHiddenSheet = opt.excel.readHiddenSheet;
        }
        if (opt.excel.readFilledCell !== undefined) {
          this.officeOptions.excel.readFilledCell = opt.excel.readFilledCell;
        }
      }
      if (opt.ppt !== undefined) {
        if (opt.ppt.readSlide !== undefined) {
          this.officeOptions.ppt.readSlide = opt.ppt.readSlide;
        }
        if (opt.ppt.readNote !== undefined) {
          this.officeOptions.ppt.readNote = opt.ppt.readNote;
        }
      }
      return true
    }
  }

  public setCatOptions(
    catOpt: {
      locales: string[] | 'all' | undefined,
      fullset: boolean | undefined,
      overWrite: boolean | undefined,
    } | undefined | null
  ): boolean {
    if (catOpt === undefined || catOpt === null) {
      return false
    } else {
      if (catOpt.locales !== undefined) {
        if (typeof catOpt.locales === 'string') {
          if (catOpt.locales === 'all') {
            this.catOptions.locales = 'all';
          }
        } else if (catOpt.locales.length === 0) {
          this.catOptions.locales = 'all';
        } else {
          this.catOptions.locales = catOpt.locales;
        }
      }
      if (catOpt.fullset !== undefined) {
        this.catOptions.fullset = catOpt.fullset;
      }
      if (catOpt.overWrite !== undefined) {
        this.catOptions.overWrite = catOpt.overWrite;
      }
      return true;
    }
  }

  public setWWCOption(wwc: {
    dupli?: string | number | null,
    over95?: string | number | null,
    over85?: string | number | null,
    over75?: string | number | null,
    over50?: string | number | null,
    under49?: string | number | null,
  } | undefined | null) {
    if (wwc !== undefined && wwc !== null) {
      if (wwc.dupli !== undefined && wwc.dupli !== null) {
        this.WWCOption.dupli = Number(wwc.dupli)
      }
      if (wwc.over95 !== undefined && wwc.over95 !== null) {
        this.WWCOption.over95 = Number(wwc.over95)
      }
      if (wwc.over85 !== undefined && wwc.over85 !== null) {
        this.WWCOption.over85 = Number(wwc.over85)
      }
      if (wwc.over75 !== undefined && wwc.over75 !== null) {
        this.WWCOption.over75 = Number(wwc.over75)
      }
      if (wwc.over50 !== undefined && wwc.over50 !== null) {
        this.WWCOption.over95 = Number(wwc.over50)
      }
      if (wwc.under49 !== undefined && wwc.under49 !== null) {
        this.WWCOption.under49 = Number(wwc.under49)
      }
    }
  }

  // ファイルの場所や拡張子等をチェックし、
  // 大分類に応じて処理を実行する
  public executeByParams(): void {
    const err = this.validate();
    if (err !== '') {
      console.log(`Validation Error: ${err}`);
      return;
    }
    if (this.mode.lg === 'CAT') {
      this.exec4CAT();
    } else {
      this.exec4Office();
    }
  }

  // 大分類が OFFICE または COUNT だった場合の入力処理～出力メソッドの呼び出し
  private exec4Office(): void {
    const opt: OptionQue = this.exportAsOptionQue();
    console.log('------------------------');
    const prs: Array<Promise<ExtractedContent[]>> = [];
    prs.push(pathContentsReader(this.srcFiles, opt));
    if (this.mode.md === 'ALIGN tsv') {
      prs.push(pathContentsReader(this.tgtFiles, opt));
    }
    Promise.all(prs).then((ds: ExtractedContent[][]) => {
      const cxt = new ExtractContext();
      const diff = new DiffInfo();
      switch (this.mode.md) {
        case 'EXTRACT txt': {
          cxt.readContent(ds[0]);
          cxt.getSingleText('src', opt).then(result => {
            this.outlet(result)
          })
          break
        }
        case 'EXTRACT json': {
          cxt.readContent(ds[0])
          const result = cxt.getRawContent('src')
          this.outlet(JSON.stringify(result, null, 2))
          break
        }

        case 'CHARAS tsv': {
          cxt.readContent(ds[0])
          const result = cxt.simpleCalc('chara')
          this.outlet(result)
          break;
        }

        case 'WORDS tsv': {
          cxt.readContent(ds[0])
          const result = cxt.simpleCalc('word')
          this.outlet(result)
          break;
        }

        case 'ALIGN tsv': {
          cxt.readContent(ds[0], ds[1]);
          cxt.getAlignedText(opt).then(result => {
            this.outlet(result)
          })
          break;
        }

        case 'DIFF-CHARAS tsv': {
          diff.analyze(ds[0])
          const result = diff.exportResult('wwc-chara', 'human', this.WWCOption)
          this.outlet(result)
          break
        }

        case 'DIFF-WORDS tsv': {
          diff.analyze(ds[0])
          const result = diff.exportResult('wwc-word', 'human', this.WWCOption)
          this.outlet(result)
          break
        }

        case 'EXTRACT-DIFF json': {
          diff.analyze(ds[0])
          const result = diff.exportResult('diff', 'json')
          this.outlet(result)
          break
        }

        case 'EXTRACT-DIFF tovis': {
          diff.analyze(ds[0])
          const tovis = new Tovis()
          tovis.parseFromObj(diff)
          const result = tovis.dump()
          this.outlet(result)
          break
        }

        case 'EXTRACT-DIFF min-tovis': {
          diff.analyze(ds[0])
          const tovis = new Tovis()
          tovis.parseFromObj(diff)
          const result = tovis.dumpMinify('CHECK-DUPLI')
          this.outlet(result)
          break
        }

        default:
          break;
      }
    }).catch((failure: ReadFailure) => {
      console.log(`Error occured at ${failure.name}`);
      console.log('--------For more details, please see below-----------');
      console.log(failure.detail);
      console.log('-----------------------------------------------------');
    });
  }

  private outlet(result: string | string[], name?: string) {
    const data = typeof result === 'string' ? result : result.join('\n')
    const filename = name ? name : this.outputFile
    if (this.mode.debug) {
      console.log('Success: DEBUG')
    } else if (this.mode.console) {
      console.log(data)
    } else {
      writeFileSync(filename, data)
      console.log(`Success: ${this.outputFile}`)
    }
  }

  // 大分類が CAT だった場合の入力処理～出力メソッドの呼び出し
  private exec4CAT(): void {
    const cat = new CatDataContent()
    const prs: Promise<boolean>[] = []
    if (this.mode.md === 'UPDATE xliff' || this.mode.md === 'REPLACE xliff') {
      const xliffStr = path2ContentStr(this.srcFiles[0])
      const tsv = createTsvArray(this.tgtFiles)
      if (typeof tsv === 'boolean') {
        console.log('TSV/TXT file error')
      } else {
        const xliffName = path2Name(this.srcFiles[0])
        const xliffDir = path2Dir(this.srcFiles[0])
        const asTerm = this.mode.md === 'REPLACE xliff'
        cat.updateXliff(xliffStr, tsv, asTerm, this.catOptions.overWrite).then(({ xml, log }) => {
          this.outlet(xml, `${xliffDir}UPDATE_${xliffName}`)
          this.outlet(JSON.stringify(log, null, 2), `${xliffDir}UPDATE_log.txt`)
        })
      }
    } else {
      for (const file of this.srcFiles) {
        const xml = path2ContentStr(file);
        const name = path2Name(file);
        prs.push(cat.loadMultilangXml(name, xml))
      }
      Promise.all(prs).then(() => {
        const tsv = cat.getMultipleTexts(this.catOptions.locales, this.catOptions.fullset)
        const pdFiles = cat.getFilesInfo().join(',')
        const pdLocales = cat.getLangsInfo().join(',')
        const pdLines = cat.getContentLength()
        const pdCharas = countFromDoubleArray(tsv, 'chara', 0)
        const pdWords = countFromDoubleArray(tsv, 'word', 0)
        console.log(`
File： ${pdFiles}
Locale： ${pdLocales}
Line: ${pdLines}
Chara: ${pdCharas}
Word: ${pdWords}
        `)
        const tsv_: string[] = []
        for (const t of tsv) {
          tsv_.push(t.join('\t'))
        }
        this.outlet(tsv_)
      }).catch(e => {
        console.log(e)
      })
    }
  }

  private validate(): string {
    let errMes = '';
    this.validated = true;
    if (this.srcFiles.length === 0) {
      errMes += 'No Source Files'
    }
    if (this.mode.md === 'ALIGN tsv' && this.srcFiles.length !== this.tgtFiles.length) {
      errMes += 'ALIGN File Number Error; ';
    }
    if (!this.outputFile.endsWith(this.mode.format)) {
      this.outputFile = `${this.outputFile}.${this.mode.format}`
    }
    console.log(this.getSettingInfo())
    return errMes;
  }

  private setFilesArray(srcOrTgt: 'source' | 'target'): boolean {
    // const oooxml = ['.docx', '.docm', '.xlsx', '.xlsm', '.pptx', '.pptm'];
    const validFormat = this.mode.lg === 'OFFICE' || this.mode.lg === 'COUNT'
      ? ['docx', 'docm', 'xlsx', 'xlsm', 'pptx', 'pptm', 'json']
      : this.mode.md === 'UPDATE xliff' ? ['xliff', 'mxliff'] : ['xliff', 'mxliff', 'tmx', 'tbx'];
    const isWhich = srcOrTgt === 'source' ? this.source : this.target;
    const toWhich = srcOrTgt === 'source' ? this.srcFiles : this.tgtFiles;
    const files = isWhich.split(',');
    for (const f of files) {
      try {
        const stat = statSync(f);
        if (stat.isDirectory()) {
          const dirName = f.replace('\\', '').endsWith('/') ? f : `${f}/`;
          const clds = readdirSync(f);
          for (const cld of clds) {
            const format = path2Format(cld)
            if (validFormat.indexOf(format) !== -1 && !cld.startsWith('~$')) {
              toWhich.push(`${dirName}${cld}`);
            }
          }
        } else {
          const format = path2Format(f)
          if (validFormat.indexOf(format) !== -1 && !f.startsWith('~$')) {
            toWhich.push(f);
          }
        }
      } catch {
        console.log(`${f} does not exist`);
        return false;
      }
    }
    if (toWhich.length === 0) {
      console.log('No Valid File');
      return false;
    } else {
      return true;
    }
  }
}


function selectmodeLg(): Promise<ModeLarge> {
  console.log('CATOVIS Dialog Interface');
  return new Promise((resolve, reject) => {
    const inquirer = require('inquirer');
    const prompts = [
      {
        type: 'list',
        name: 'modeLg',
        message: 'Select Format',
        choices: ['OFFICE', 'COUNT', 'CAT', 'DEFAULT PRESET'],
      },
    ]
    inquirer.prompt(prompts).then((answer: any) => {
      resolve(answer.modeLg as ModeLarge)
    })
  })
}

function officeInquirerDialog(largeChoice: 'OFFICE' | 'COUNT', sourceFiles?: string) {
  const middleChoices = largeChoice === 'OFFICE' ? officeModes : countModes
  const control = new CLIController();
  const inquirer = require('inquirer');
  const prompts = [
    {
      type: 'list',
      name: 'modeMd',
      message: 'Select Execution Mode.',
      choices: middleChoices,
    },
    {
      name: 'source',
      message: 'Source input file(s)/folder(s) with comma separated. Remain blank for current directory',
      when: (): boolean => {
        return sourceFiles === undefined;
      },
    },
    {
      name: 'target',
      message: 'Target input file(s)/folder(s) with comma separated.',
      when: (answerSoFar: any): boolean => {
        return answerSoFar.modeMd === 'ALIGN tsv';
      },
    },
    {
      name: 'outputFile',
      message: (answerSoFar: any): string => {
        const format = answerSoFar.modeMd.substr(answerSoFar.modeMd.lastIndexOf(' ') + 1)
        return `Input filename for output. [${format}] is selected`
      },
    },
    {
      name: 'excludePattern',
      message: 'Input RegExp string for excluding from result.',
    },
    {
      type: 'checkbox',
      name: 'others',
      message: 'Designate other options(Multiple select with space bar).',
      choices: [
        'Dont add separation marks',
        'Word-Before-Revision', 'PPT-Slide', 'PPT-Note', 'Excel-Hidden-Sheet', 'Excel-Filled-Cell',
        'DEBUG'],
    },
  ];
  inquirer.prompt(prompts).then((answer: any) => {
    if (sourceFiles !== undefined) {
      answer.source = sourceFiles;
    }
    control.setMode2(largeChoice, answer.modeMd);
    control.setConsole(answer.outputFile === '')
    control.setSource(answer.source);
    control.setTarget(answer.target)
    control.setOutputFile(answer.outputFile)
    if (answer.others.indexOf('DEBUG') !== -1) {
      control.setDebug(true)
    }
    control.setOfficeOptions({
      common: {
        excludePattern: answer.excludingPattern,
        withSeparator: answer.others.indexOf('Dont add separation marks') !== -1
      },
      word: {
        afterRev: answer.others.indexOf('Word-Before-Revision') === -1
      },
      excel: {
        readFilledCell: answer.others.indexOf('Excel-Filled-Cell') !== -1,
        readHiddenSheet: answer.others.indexOf('Excel-Hidden-Sheet') !== -1,
      },
      ppt: {
        readSlide: answer.others.indexOf('PPT-Slide') !== -1,
        readNote: answer.others.indexOf('PPT-Note') !== -1,
      }
    })
    control.executeByParams();
  });
}

function catInquirerDialog(sourceFiles?: string) {
  const control = new CLIController();
  const inquirer = require('inquirer');
  const prompts = [
    {
      type: 'list',
      name: 'modeMd',
      message: 'Select Execution Mode.',
      choices: catModes,
    },
    {
      name: 'source',
      message: 'Source input file(s)/folder(s) with comma separated. Remain blank for current directory',
      when: (): boolean => {
        return sourceFiles === undefined;
      },
    },
    {
      name: 'target',
      message: 'Input 1 tsv or 2 txt files to update XLIFF file',
      when: (answerSoFar: any): boolean => {
        return answerSoFar.modeMd === 'UPDATE xliff' || answerSoFar.modeMd === 'REPLACE xliff';
      },
    },
    {
      name: 'locales',
      message: 'Input locales to extract with comma separated. Remain blank for all locales.',
      when: (answerSoFar: any): boolean => {
        return answerSoFar.modeMd.startsWith('EXTRACT');
      },
    },
    {
      type: 'list',
      name: 'fullset',
      message: 'Select if you only want to export the segments that have the sentences in all of the locales',
      choices: ['All', 'Only-fullset'],
      when: (answerSoFar: any): boolean => {
        if (answerSoFar.modeMd.startsWith('EXTRACT')) {
          return answerSoFar.locales.split(',').length > 1 || answerSoFar.locales === '';
        } else {
          return false
        }
      },
    },
    {
      name: 'outputFile',
      message: 'Output file name. Able to use ".tsv". output to "console" if blank.',
      when: (answerSoFar: any): boolean => {
        return answerSoFar.modeMd.startsWith('EXTRACT')
      },
    },
  ];
  inquirer.prompt(prompts).then((answer: any) => {
    if (sourceFiles !== undefined) {
      answer.source = sourceFiles;
    }
    control.setMode2('CAT', answer.modeMd);
    control.setConsole(answer.outputFile === '' && answer.modeMd.startsWith('EXTRACT'))
    control.setSource(answer.source);
    if (answer.target !== undefined) {
      control.setTarget(answer.target)
    }
    control.setOutputFile(answer.outputFile)
    control.executeByParams();
  });
}

// #起動時に処理される部分
console.log('------------------------');
const program = require('commander');
program
  // .option('-c, --cmd', 'Use full CLI when true. Default value is "false"', false)
  .option('-p, --preset', 'Use this flag for executing with pre-designated params')
  .option('-y, --yaml <item>', 'Designate the yaml file for preset')
  .option('--default-preset', 'Create the default preset file')
// .option('-m, --mode <item>', 'Select Execution Mode. Choose From "EXTRACT" | "ALIGN" | "COUNT" | "DIFF" | "TOVIS"')
// .option('-s, --source <item>', 'Source input file(s)/folder(s) with comma separated. You can input directly without option. Remain blank for current directory')
// .option('-t, --target <item>', 'Target input file(s)/folder(s) with comma separated.')
// .option('-i, --input <item>', 'A txt file which lists the input file. Currently not provided yet')
// .option('-o, --output <item>', 'Designate output file name with extension. Format can be selected from json, txt or tsv. Use standard output when blank')
// .option('-e, --excludePattern <item>', 'RegExp string for excluding from result. The expression "^" and "$" will be automaticaly added.')
// .option('-w, --withSeparator', 'Use separation marks in out file. Default value is "true"', true)
// .option('--others <item>',
// 'Designate "Without-Separator(or wosep) | Word-Before-Rev(or norev) |PPT-Note(or note) | Excel-Hidden-Sheet(or hide) | Excel-Filled-Cell(or filled) | DEBUG". Multiple selection with comma.');

const args: any = program.parse(process.argv);

// デフォルトのプリセットファイルの書き出し
if (args.defaultPreset) {
  writeDefaultPreset()
  // プリセットモードを実行する場合
} else if (args.preset) {
  const control = new CLIController()
  // yaml ファイルの正規化
  let pyaml =
    args.yaml === undefined ? './preset.yaml' :
    args.yaml.endsWith('.yaml') ? args.yaml :
    args.yaml.endsWith('.yml') ? args.yaml :
    `${args.yaml}.yaml`;
  // 指定ファイルの存在を確認する。
  // なかった場合は presets フォルダを確認し、それでもなければ'./preset.yaml' を使用する
  try {
    statSync(pyaml);
  }
  catch {
    try {
      statSync(`./presets/${pyaml}`);
      pyaml = `./presets/${pyaml}`;
    }
    catch {
      console.log(`${args.yaml} does not exist`);
      pyaml = './preset.yaml';
    }
  }
  // プリセットファイルの読み込み
  const presetYaml = readFileSync(pyaml).toString();
  const yo = load(presetYaml) as any;
  control.setMode1(yo.mode)
  control.setSource(yo.sourceFiles)
  control.setTarget(yo.targetFiles)
  control.setConsole(yo.console)
  control.setDebug(yo.debug)
  control.setOutputFile(yo.outputFile);
  control.setOfficeOptions(yo.office)
  control.setCatOptions(yo.cat)
  control.setWWCOption(yo.wwc)
  control.executeByParams();
} else {
  selectmodeLg().then((lg) => {
    if (lg === 'DEFAULT PRESET') {
      writeDefaultPreset();
    } else if (lg === 'OFFICE' || lg === 'COUNT') {
      if (args.args.length !== 0) {
        officeInquirerDialog(lg, args.args[0]);
      } else {
        officeInquirerDialog(lg);
      }
    } else {
      if (args.args.length !== 0) {
        catInquirerDialog(args.args[0]);
      } else {
        catInquirerDialog();
      }
    }
  })
}

function writeDefaultPreset() {
  const defaultPreset = `
  # ------------------------------------------------------------
  # [mode]
  # Select from the followings:
    # - 'OFFICE:EXTRACT txt'
    # - 'OFFICE:EXTRACT json'
    # - 'OFFICE:EXTRACT-DIFF json'
    # - 'OFFICE:EXTRACT-DIFF tovis' 
    # - 'OFFICE:EXTRACT-DIFF min-tovis' 
    # - 'OFFICE:ALIGN tsv' 
    # - 'COUNT:CHARAS tsv'
    # - 'COUNT:WORDS tsv'
    # - 'COUNT:DIFF-CHARAS tsv'
    # - 'COUNT:DIFF-WORDS tsv'
    # - 'CAT:EXTRACT tsv'
    # - 'CAT:EXTRACT-DIFF json'
    # - 'CAT:EXTRACT-DIFF tovis'
    # - 'CAT:EXTRACT-DIFF min-tovis'
    # - 'CAT:UPDATE xliff'
  # If the selection is not proper, then the mode will be set as 'OFFICE:EXTRACT txt' implicity
  # OFFICE supports: docx / docm / xlsx / xlsm / pptx / pptm
  # CAT supports: xliff / mxliff / tmx / tbx
  # ------------------------------------------------------------
  mode: 'OFFICE:EXTRACT txt'

  # ------------------------------------------------------------
  # [console]
  # Set true if you do not want to create a file
  # ------------------------------------------------------------
  console: false

  # ---------------
  # [outputFile]
  # Set a filename to output (default: preset)
  # It is NOT mandantory, and be ignored when the console is true
  # When set '!DEBUG!', the system would enter DEBUG mode, it does not create file
  # and neither display the result on console.
  # ---------------
  outputFile: './result.txt'

  # ---------------
  # [sourceFiles]
  # list up the source file(s) or folder(s)
  # ---------------
  sourceFiles:
    - './jp/'
    
  # ---------------
  # [targetFiles]
  # list up the target file(s) or folder(s)
  # ---------------
  targetFiles:
    - ./en/

  # ---------------
  # [office]
  # Setting for detailed extraction (for office files)
  # ---------------
  office:
    common:
      segmentation: true
      delimiters: '(。|！|？|(\. )|(\! )|(\? ))'
      excludePattern: ''
      withSeparator: true

    word:
      rev: true
    excel:
      readHiddenSheet: false
      readFilledCell: true
    ppt:
      readSlide: true
      readNote: true

  # ---------------
  # [cat] 
  # Setting for detailed extraction (for CAT files)
  # ---------------
  cat:
    locales: 'all'
    fullset: false
    overWrite: false

  # ---------------
  # [WWC] 
  # Setting for Weighted Word Count(for COUNT)
  # ---------------
  wwc:
    dupli: 0.15
    over95: 0.3
    over85: 0.6
    over75: 0.8
    over50: 1
    under49: 1

  # ------------------------------------------------------------
  # [debug]
  # Not create output file, nor display on console.
  # It is prior to the console and outputfile option. 
  # ------------------------------------------------------------
  debug: false
  `
  writeFileSync('./preset.yaml', defaultPreset)
  console.log('Default preset.yaml has been set: "./preset.yaml"')
}