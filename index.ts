import { readFileSync, readdirSync, statSync, writeFileSync } from 'fs';
import { load } from 'js-yaml'

import { ExtractContext } from './office-funcs/extract';
import { ReadingOption } from './office-funcs/option';
import { DiffInfo } from './office-funcs/diff';
import { FileStats } from './office-funcs/stats';
import { Tovis } from './office-funcs/tovis';
import { CatDataContent } from './office-funcs/cats';

// import { cnm, pathContentsReader, ReadFailure } from './office-funcs/util';
import { pathContentsReader, path2ContentStr, createTsvArray } from './office-funcs/util-sv'
import { path2Format, path2Name, path2Dir } from './office-funcs/util';

const modeChoices = ['EXTRACT', 'ALIGN', 'COUNT', 'DIFF', 'TOVIS'];

// 初期設定値とともにオプション項目を管理するクラス
// 主要な機能は以下のとおり
// 1. コンストラクタ
// - 引数を受け取ると、指定項目のみを変更する
// 2. OptionQue にあった形で設定をエクスポートする
// 3. ダイアログで入力した項目をもとに、指定項目を再設定する
// 4. オプション項目をもとに、処理を実行する
// - ファイルパスの検証等は、実行時に行われる

class CLIParams {
  // validateメソッドで、ファイルパスにすべて問題がないと判断されたら true になる
  private validated: boolean;

  // 処理の大分類：MS office または CAT(TMX / TBX / XLIFF)
  public hyperMode: 'OFFICE' | 'CAT';

  // 入出力に関するオプション項目
  public mode: 'EXTRACT' | 'ALIGN' | 'COUNT' | 'DIFF' | 'TOVIS' | 'UPDATE';
  public source: string;
  public target: string;
  public oMode: 'json' | 'plain' | 'console' | '';
  public oFile: string;
  public sFiles: string[];
  public tFiles: string[];

  // Officeの抽出に関係するオプション項目
  // ReadingOptionの各項目に対応している
  public excluding: boolean;
  public excludePattern: string;
  public wordRev: boolean;
  public withSeparator: boolean;
  public readNote: boolean;
  public readHiddenSheet: boolean;
  public readFilledCell: boolean;

  // CATの処理に関するオプション項目
  public locales: string[] | 'all';
  public fullset: boolean;
  public overWrite: boolean;
  public asTerm: boolean;

  constructor(args: any) {
    // 初期値の設定を行う

    // 自身のメソッド内でのみ変更可能な項目をつくる
    this.sFiles = [];
    this.tFiles = [];
    this.validated = false;

    this.locales = [];
    this.fullset = false;
    this.overWrite = false;
    this.asTerm = false;

    // OFFICEファイル か CAT ファイルか
    // 既定値は OFFICE
    if (args.hyperMode === 'CAT') {
      this.hyperMode = 'CAT';
    } else {
      this.hyperMode = 'OFFICE';
    }

    // モード設定　既定値は EXTRACT
    if (args.mode !== undefined && modeChoices.indexOf(args.mode) !== -1) {
      this.mode = args.mode;
    } else {
      this.mode = 'EXTRACT';
    }

    // 原稿ファイルの場所
    // 既定値はルート
    // 名前付き引数のほか、コマンドライン引数の最初に入れることもできる
    if (args.args !== undefined && args.args[0] !== undefined) {
      this.source = args.args[0];
    } else if (args.source !== undefined) {
      this.source = args.source !== '' ? args.source : './';
    } else {
      this.source = './';
    }

    // 訳文ファイルの場所
    // 既定値はルート
    if (args.target !== undefined) {
      this.target = args.target !== '' ? args.target : './';
    } else {
      this.target = './';
    }
    this.oFile = args.output !== undefined ? args.output : '';

    // 出力モード
    // 出力ファイル名から、モードの設定を行う
    // 入力が無かった場合は基本的にはコンソール出力
    if (this.oFile === undefined) {
      this.oMode = 'console';
    } else if (this.oFile.endsWith('.json')) {
      this.oMode = 'json';
    } else if (this.oFile.endsWith('.txt') || this.oFile.endsWith('.tsv')) {
      this.oMode = 'plain';
    } else {
      this.oMode = 'console';
    }

    // 抽出のための設定
    // コマンドライン引数から読み込む場合
    this.excluding = args.excludePattern === undefined;
    this.excludePattern = args.excludePattern !== undefined ? args.excludePattern : '';
    this.wordRev = true;
    this.withSeparator = true;
    this.readNote = true;
    this.readHiddenSheet = true;
    this.readFilledCell = true;

    // ダイアログから読み込む場合
    const others: string[] = args.others !== undefined ? args.others.split(',') : [];
    for (let other of others) {
      other = other.toLowerCase();
      switch (other) {
        case 'without-separator':
        case 'wosep':
          this.withSeparator = false;

        case 'word-before-rev':
        case 'norev':
          this.wordRev = false;
          break;

        case 'ppt-note':
        case 'note':
          this.readNote = false;
          break;

        case 'excel-hidden-sheet':
        case 'hide':
          this.readHiddenSheet = false;
          break;

        case 'excel-filled-cell':
        case 'filled':
          this.readFilledCell = false;
          break;

        case 'debug':
          this.oMode = '';
          break;

        default:
          break;
      }
    }
  }

  public exportAsOptionQue(): OptionQue {
    return {
      common: {
        name: 'via-cli',
        withSeparator: this.withSeparator,
        excluding: this.excluding,
        excludePattern: this.excludePattern,
        segmentation: true,
        delimiters: '(\\。|\\. |\\! |\\? |\\！|\\？)',
      },
      word: {
        afterRev: this.wordRev,
      },
      excel: {
        readHiddenSheet: this.readHiddenSheet,
        readFilledCell: this.readFilledCell,
      },
      ppt: {
        readNote: this.readNote,
      }
    };
  }

  public getSettingInfo(): string {
    const info = {
      validated: this.validate,
      hyperMode: this.hyperMode,
      mode: this.mode,
      source: this.source,
      target: this.target,
      oMode: this.oMode,
      oFile: this.oFile,
      sFiles: this.sFiles,
      tFiles: this.tFiles,
      excluding: this.excluding,
      excludePattern: this.excludePattern,
      wordRev: this.wordRev,
      withSeparator: this.withSeparator,
      readNote: this.readNote,
      readHiddenSheet: this.readHiddenSheet,
      readFilledCell: this.readFilledCell,
      locales: this.locales,
      fullset: this.fullset,
    }
    return JSON.stringify(info, null, 2)
  }

  // ダイアログの設定をもとに、再設定する
  public updateFromDialog(ans: any): void {
    if (ans.hyperMode) {
      this.hyperMode = ans.hyperMode;
    }
    if (ans.mode) {
      this.mode = ans.mode;
    }
    this.excluding = ans.excludePattern !== '';
    this.excludePattern = ans.excludePattern;
    this.withSeparator = ans.withSeparator;
    this.source = ans.source !== '' ? ans.source : './';
    if (ans.target !== undefined) {
      this.target = ans.target !== '' ? ans.target : './';
    }
    switch (this.mode) {
      case 'EXTRACT':
        if (ans.outputFile === undefined || ans.outputFile === '') {
          this.oFile = '';
          this.oMode = 'console';
        } else if (ans.outputFile.endsWith('.txt')) {
          this.oFile = ans.outputFile;
          this.oMode = 'plain';
        } else if (ans.outputFile.endsWith('.json')) {
          this.oFile = ans.outputFile;
          this.oMode = 'json';
        } else {
          this.oFile = ans.outputFile + '.txt';
          this.oMode = 'plain';
        }
        break;

      case 'ALIGN':
        if (ans.outputFile === undefined || ans.outputFile === '') {
          this.oFile = '';
          this.oMode = 'console';
        } else if (ans.outputFile.endsWith('.tsv')) {
          this.oFile = ans.outputFile;
          this.oMode = 'plain';
        } else if (ans.outputFile.endsWith('.json')) {
          this.oFile = ans.outputFile;
          this.oMode = 'json';
        } else {
          this.oFile = ans.outputFile + '.tsv';
          this.oMode = 'plain';
        }
        break;

      case 'COUNT':
        if (ans.outputFile === undefined || ans.outputFile === '') {
          this.oFile = '';
          this.oMode = 'console';
        } else if (ans.outputFile.endsWith('.tsv')) {
          this.oFile = ans.outputFile;
          this.oMode = 'plain';
        } else if (ans.outputFile.endsWith('.json')) {
          this.oFile = ans.outputFile;
          this.oMode = 'json';
        } else {
          this.oFile = ans.outputFile + '.tsv';
          this.oMode = 'plain';
        }
        break;

      case 'DIFF':
        if (ans.outputFile === undefined || ans.outputFile === '') {
          this.oFile = '';
          this.oMode = 'console';
        } else if (ans.outputFile.endsWith('.json')) {
          this.oFile = ans.outputFile;
          this.oMode = 'json';
        } else {
          this.oFile = ans.outputFile + '.json';
          this.oMode = 'json';
        }
        break;

      case 'TOVIS':
        if (ans.outputFile === undefined || ans.outputFile === '') {
          this.oFile = '';
          this.oMode = 'console';
        } else if (ans.outputFile.endsWith('.tovis')) {
          this.oFile = ans.outputFile;
          this.oMode = 'plain';
        } else if (ans.outputFile.endsWith('.json')) {
          this.oFile = ans.outputFile;
          this.oMode = 'json';
        } else {
          this.oFile = ans.outputFile + '.tovis';
          this.oMode = 'plain';
        }
        break;

      default:
        break;
    }

    if (ans.others !== undefined) {
      for (const other of ans.others) {
        switch (other) {
          case 'Dont add separation marks':
            this.withSeparator = false;
            break;

          case 'Word-Before-Revision':
            this.wordRev = false;
            break;

          case 'PPT-Note':
            this.readNote = false;
            break;

          case 'Excel-Hidden-Sheet':
            this.readHiddenSheet = false;
            break;

          case 'Excel-Filled-Cell':
            this.readFilledCell = false;
            break;

          case 'DEBUG':
            this.oMode = '';
            break;

          default:
            break;
        }
      }
    }

    if (ans.locales !== undefined) {
      this.locales = ans.locales;
    }

    if (ans.fullset !== undefined) {
      this.fullset = ans.fullset.toLowerCase() === 'only-fullset';
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
    console.log(this.getSettingInfo())
    if (this.hyperMode === 'OFFICE') {
      this.exec4Office();
    } else {
      this.exec4CAT();
    }
  }

  // 大分類が OFFICE だった場合の入力処理～出力メソッドの呼び出し
  private exec4Office(): void {
    const opt: OptionQue = this.exportAsOptionQue();
    console.log('------------------------');
    const prs: Array<Promise<ExtractedContent[]>> = [];
    prs.push(pathContentsReader(this.sFiles, opt));
    if (this.mode === 'ALIGN') {
      prs.push(pathContentsReader(this.tFiles, opt));
    }
    Promise.all(prs).then((ds: ExtractedContent[][]) => {
      const cxt = new ExtractContext();
      const diff = new DiffInfo();
      switch (this.mode) {
        case 'EXTRACT':
          cxt.readContent(ds[0]);
          this.officeOutlet('EXTRACT', opt, this.oMode, this.oFile, { cxt });
          break;

        case 'COUNT':
          diff.analyze(ds[0]);
          diff.calcWWC('chara');
          this.officeOutlet('COUNT', opt, this.oMode, this.oFile, { diff });
          break;

        case 'DIFF':
          diff.analyze(ds[0]);
          this.officeOutlet('DIFF', opt, this.oMode, this.oFile, { diff });
          break;

        case 'ALIGN':
          cxt.readContent(ds[0], ds[1]);
          this.officeOutlet('ALIGN', opt, this.oMode, this.oFile, { cxt });
          break;

        case 'TOVIS':
          diff.analyze(ds[0]);
          this.officeOutlet('TOVIS', opt, this.oMode, this.oFile, { diff });
          break;

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

  // 大分類が OFFICE だった場合の出力メソッド
  private async officeOutlet(
    eMode: 'EXTRACT' | 'ALIGN' | 'COUNT' | 'DIFF' | 'TOVIS' | 'DEBUG',
    opt: OptionQue, oMode: 'json' | 'plain' | 'console' | '',
    oFile: string, data: { cxt?: ExtractContext, diff?: DiffInfo },
  ): Promise<void> {

    console.log(`${eMode}->${oFile}@${oMode}`)

    let result: string[] = [];
    switch (eMode) {
      case 'EXTRACT':
        if (data.cxt !== undefined) {
          if (oMode === 'json') {
            result = [JSON.stringify(data.cxt.getRawContent('src'), null, 2)];
          } else {
            result = await data.cxt.getSingleText('src', opt);
          }
        }
        break;

      case 'ALIGN':
        if (data.cxt !== undefined) {
          result = await data.cxt.getAlignedText(opt);
        }
        break;

      case 'COUNT':
        if (data.diff !== undefined) {
          const format = oMode === 'json' ? 'json' : 'human';
          result = [data.diff.exportResult('wwc-chara', format)];
        }
        break;

      case 'DIFF':
        if (data.diff !== undefined) {
          result = [data.diff.exportResult('diff', 'json')];
        }
        break;

      case 'TOVIS':
        const tovis = new Tovis();
        if (data.diff !== undefined) {
          tovis.parseFromObj(data.diff);
          if (oFile.endsWith('tovis')) {
            result = tovis.dump();
          } else {
            result = [tovis.dumpToJson()];
          }
        }
        break;

      default:
        break
    }
    switch (oMode) {
      case 'console':
        console.log(result.join('\n'));
        break;

      case 'json':
      case 'plain':
        writeFileSync(`./${oFile}`, result.join('\n'));
        break;

      default:
        break;
    }
  }

  // 大分類が CAT だった場合の入力処理～出力メソッドの呼び出し
  private exec4CAT(): void {
    const cat = new CatDataContent()
    const prs: Promise<boolean>[] = []
    if (this.mode === 'UPDATE') {
      const xliffStr = path2ContentStr(this.sFiles[0])
      const tsv = createTsvArray(this.tFiles)
      if (typeof tsv === 'boolean') {
        console.log('TSV/TXT file error')
      } else {
        const xliffName = path2Name(this.sFiles[0])
        const xliffDir = path2Dir(this.sFiles[0])
        cat.updateXliff(xliffStr, tsv, false, false).then(({xml, log}) => {
          // console.log(xliffDir)
          // console.log(xliffName)
          writeFileSync(`${xliffDir}UPDATE_${xliffName}`, xml)
          writeFileSync(`${xliffDir}UPDATE_log.txt`, JSON.stringify(log, null, 2))
        })
      }
    } else {
      for (const file of this.sFiles) {
        const xml = path2ContentStr(file);
        const name = path2Name(file);
        prs.push(cat.loadMultilangXml(name, xml))
      }
      Promise.all(prs).then(() => {
        const exp = cat.getMultipleTexts(this.locales, this.fullset)
        console.log(cat.getFilesInfo())
        console.log(cat.getLangsInfo())
        console.log(cat.getContentLength())
        console.log(exp)
      }).catch(e => {
        console.log(e)
      })
    }
  }

  private validate(): string {
    let errMes = '';
    this.validated = true;
    const isSourceOk = this.validateAndSetFiles('source');
    if (!isSourceOk) {
      errMes += 'Source Files Error; ';
    }
    const isTargetOK = this.mode === 'ALIGN' ? this.validateAndSetFiles('target') : true;
    if (!isTargetOK) {
      errMes += 'Target Files Error; ';
    }
    if (this.mode === 'ALIGN' && this.sFiles.length !== this.tFiles.length) {
      errMes += 'ALIGN File Number Error; ';
    }
    if (this.mode === 'EXTRACT' && this.oFile.endsWith('.tsv')) {
      this.oFile = this.oFile.replace('.tsv', '.txt');
    }
    if (this.mode === 'ALIGN' && this.oFile.endsWith('.txt')) {
      this.oFile = this.oFile.replace('.txt', '.tsv');
    }
    return errMes;
  }

  private validateAndSetFiles(srcOrTgt: 'source' | 'target'): boolean {
    // const oooxml = ['.docx', '.docm', '.xlsx', '.xlsm', '.pptx', '.pptm'];
    const validFormat = this.hyperMode === 'OFFICE'
      ? ['docx', 'docm', 'xlsx', 'xlsm', 'pptx', 'pptm', 'json']
      : this.mode === 'UPDATE' ? ['xliff', 'mxliff'] : ['xliff', 'mxliff', 'tmx', 'tbx'];
    const isWhich = srcOrTgt === 'source' ? this.source : this.target;
    const toWhich = srcOrTgt === 'source' ? this.sFiles : this.tFiles;
    const files = isWhich.split(',');
    for (const f of files) {
      try {
        const stat = statSync(f);
        if (stat.isDirectory()) {
          const dirName = f.replace('\\', '').endsWith('/') ? f : `${f}/`;
          const clds = readdirSync(f);
          for (const cld of clds) {
            const format = path2Format(cld)
            if (validFormat.indexOf(format) !== -1) {
              toWhich.push(`${dirName}${cld}`);
            }
          }
        } else {
          const format = path2Format(f)
          if (validFormat.indexOf(format) !== -1) {
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


function selectHyperMode(): Promise<'OFFICE' | 'CAT'> {
  console.log('CATOVIS Dialog Interface');
  return new Promise((resolve, reject) => {
    const inquirer = require('inquirer');
    const prompts = [
      {
        type: 'list',
        name: 'hyperMode',
        message: 'Select Format',
        choices: ['OFFICE', 'CAT'],
      },
    ]
    inquirer.prompt(prompts).then((answer: any) => {
      if (answer.hyperMode === 'CAT') {
        resolve('CAT');
      } else {
        resolve('OFFICE');
      }
    })
  })
}

function officeInquirerDialog(sourceFiles?: string) {
  const params = new CLIParams({});
  const inquirer = require('inquirer');
  const prompts = [
    {
      type: 'list',
      name: 'mode',
      message: 'Select Execution Mode.',
      choices: ['EXTRACT', 'ALIGN', 'COUNT', 'DIFF', 'TOVIS'],
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
        return answerSoFar.mode === 'ALIGN';
      },
    },
    {
      name: 'outputFile',
      message: (answerSoFar: any): string => {
        let mes: string = 'Output file name. ';
        switch (answerSoFar.mode) {
          case 'EXTRACT':
            mes += 'Able to use ".txt"(implicit) or ".json", output to "console" if blank.';
            break;

          case 'ALIGN':
            mes += 'Able to use ".tsv"(implicit) or ".json", output to "console" if blank.';
            break;

          case 'COUNT':
            mes += 'Able to use ".tsv"(implicit), output to "console" if blank.';
            break;

          case 'DIFF':
            mes += 'Able to use ".json"(implicit), output to "console" if blank.';
            break;

          case 'TOVIS':
            mes += 'Able to use ".tovis"(implicit), output to "console" if blank.';
            break;

          default:
            break;
        }
        return mes;
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
        'Word-Before-Revision', 'PPT-Note', 'Excel-Hidden-Sheet', 'Excel-Filled-Cell',
        'DEBUG'],
    },
  ];
  inquirer.prompt(prompts).then((answer: any) => {
    // cnm(answer)
    if (sourceFiles !== undefined) {
      answer.source = sourceFiles;
    }
    params.updateFromDialog(answer);
    params.executeByParams();
  });
}

function catInquirerDialog(sourceFiles?: string) {
  const params = new CLIParams({});
  const inquirer = require('inquirer');
  const prompts = [
    {
      type: 'list',
      name: 'mode',
      message: 'Select Execution Mode.',
      choices: ['EXTRACT', 'UPDATE'],
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
        return answerSoFar.mode === 'UPDATE';
      },
    },
    {
      name: 'locales',
      message: 'Input locales to extract with comma separated. Remain blank for all locales.',
      when: (answerSoFar: any): boolean => {
        return answerSoFar.mode === 'EXTRACT';
      },
    },
    {
      type: 'list',
      name: 'fullset',
      message: 'Select if you only want to export the segments that have the sentences in all of the locales',
      choices: ['All', 'Only-fullset'],
      when: (answerSoFar: any): boolean => {
        if (answerSoFar.mode === 'UPDATE') {
          return false
        } else {
          return answerSoFar.locales.split(',').length > 1 || answerSoFar.locales === '';
        }
      },
    },
    {
      name: 'outputFile',
      message: 'Output file name. Able to use ".tsv". output to "console" if blank.',
      when: (answerSoFar: any): boolean => {
        if (answerSoFar.mode === 'UPDATE') {
          return false
        } else {
          return answerSoFar.locales.split(',').length > 1 || answerSoFar.locales === '';
        }
      },
    },
  ];
  inquirer.prompt(prompts).then((answer: any) => {
    if (sourceFiles !== undefined) {
      answer.source = sourceFiles;
    }
    answer.hyperMode = 'CAT';
    if (answer.locales === '') {
      answer.locales = 'all'
    }
    if (answer.outputFile !== undefined) {
      if (answer.outputFile !== '' && !answer.outputFile.endsWith('.tsv')) {
        answer.outputFile = answer.outputFile + '.tsv'
      }
    }
    params.updateFromDialog(answer);
    params.executeByParams();
  });
}

// #起動時に処理される部分
console.log('------------------------');
const program = require('commander');
program
  .option('-c, --cmd', 'Use full CLI when true. Default value is "false"', false)
  .option('-p, --preset', 'Use this flag for executing with pre-designated params')
  .option('-m, --mode <item>', 'Select Execution Mode. Choose From "EXTRACT" | "ALIGN" | "COUNT" | "DIFF" | "TOVIS"')
  .option('-s, --source <item>', 'Source input file(s)/folder(s) with comma separated. You can input directly without option. Remain blank for current directory')
  .option('-t, --target <item>', 'Target input file(s)/folder(s) with comma separated.')
  .option('-i, --input <item>', 'A txt file which lists the input file. Currently not provided yet')
  .option('-o, --output <item>', 'Designate output file name with extension. Format can be selected from json, txt or tsv. Use standard output when blank')
  .option('-e, --excludePattern <item>', 'RegExp string for excluding from result. The expression "^" and "$" will be automaticaly added.')
  .option('-w, --withSeparator', 'Use separation marks in out file. Default value is "true"', true)
  .option('--others <item>',
    'Designate "Without-Separator(or wosep) | Word-Before-Rev(or norev) |PPT-Note(or note) | Excel-Hidden-Sheet(or hide) | Excel-Filled-Cell(or filled) | DEBUG". Multiple selection with comma.');

const args: any = program.parse(process.argv);

if (args.preset) {
  const params = new CLIParams({})
  // あらかじめ動作を設定する
  const presetYaml = readFileSync('./preset.yaml').toString();
  const yamlOpt = load(presetYaml) as any;
  params.hyperMode = yamlOpt.hyperMode || 'OFFICE';
  params.mode = yamlOpt.mode || 'EXTRACT';
  params.oFile = yamlOpt.outputFile || 'preset';
  params.oMode = yamlOpt.outputType || '';
  params.locales = yamlOpt.locales || 'all';
  params.fullset = yamlOpt.locales || false;
  params.source = yamlOpt.sourceFiles ? yamlOpt.sourceFiles.join(',') : '';
  if (yamlOpt.targetFiles !== undefined) {
    params.target = yamlOpt.targetFiles.join(',')
  }
  if (yamlOpt.common !== undefined) {
    if (yamlOpt.common.excludePattern !== undefined && yamlOpt.common.excludePattern !== '') {
      params.excluding = true;
      params.excludePattern = yamlOpt.common.excludePattern;
    } else {
      params.excluding = false;
    }
    if (yamlOpt.common.withSeparator !== undefined) {
      params.withSeparator = yamlOpt.common.withSeparator;
    }
  }
  if (yamlOpt.word !== undefined) {
    if (yamlOpt.word.rev !== undefined) {
      params.wordRev = yamlOpt.word.rev;
    }
  }
  if (yamlOpt.excel !== undefined) {
    if (yamlOpt.excel.readHiddenSheet !== undefined) {
      params.readHiddenSheet = yamlOpt.excel.readHiddenSheet;
    }
    if (yamlOpt.excel.readFilledCell !== undefined) {
      params.readFilledCell = yamlOpt.excel.readFilledCell;
    }
  }
  if (yamlOpt.ppt !== undefined) {
    if (yamlOpt.ppt.readNote !== undefined) {
      params.readNote = yamlOpt.ppt.readNote;
    }
  }
  console.log(params)
  params.executeByParams();
} else if (args.cmd === false) {
  selectHyperMode().then((hm) => {
    if (hm === 'OFFICE') {
      if (args.args.length !== 0) {
        officeInquirerDialog(args.args[0]);
      } else {
        officeInquirerDialog();
      }
    } else {
      if (args.args.length !== 0) {
        catInquirerDialog(args.args[0]);
      } else {
        catInquirerDialog();
      }
    }
  })
} else {
  const params = new CLIParams(args);
  params.executeByParams();
}
