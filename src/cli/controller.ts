import { readdirSync, statSync, writeFileSync } from 'fs';

import { CatovisOrganizer } from "../bilingualOrganizer"
// import { batchPathContentsReader, path2ContentStr, createTsvArray } from '../util/fileRead'
import { path2Buffer } from '../util/readSv'
import { path2Format, path2Name, path2Dir } from '../util/util';

import type { ModeLarge, ModeMiddleOffice, ModeMiddleCount, ModeMiddleCat } from '../util/params'
// 初期設定値とともにオプション項目を管理するクラス
// 主要な機能は以下のとおり
// 1. コンストラクタ
// - 引数を受け取ると、指定項目のみを変更する
// 2. OptionQue にあった形で設定をエクスポートする
// 3. ダイアログで入力した項目をもとに、指定項目を再設定する
// 4. オプション項目をもとに、処理を実行する
// - ファイルパスの検証等は、実行時に行われる

export class CLIController extends CatovisOrganizer {

  // validateメソッドで、ファイルパスにすべて問題がないと判断されたら true になる
  private validated: boolean;

  private outputParams: {
    console: boolean,
    debug: boolean,
  }

  private source: string[];
  private target: string[];
  private outputFile: string;
  private srcFiles: string[];
  private tgtFiles: string[];
  private srcData: ReadData[];
  private tgtData: ReadData[];

  constructor() {
    // 初期値の設定を行う
    super()
    this.validated = false;

    this.outputParams = {
      // format: 'txt',
      console: false,
      debug: false,
    }

    // 原稿ファイルの場所
    // 既定値はルート
    this.source = ['./']
    this.target = ['./']
    this.srcFiles = [];
    this.tgtFiles = [];
    this.srcData = [];
    this.tgtData = [];
    this.outputFile = './'
  }

  // 設定されている情報を出力する
  public getSettingInfo(): string {
    if (!this.validated) {
      this.validate()
    }
    const info = {
      validated: this.validated,
      mode: this.lg,
      operation: this.mid,
      outlet: this.outputParams,
      source: this.source,
      target: this.target,
      outputFile: this.outputFile,
      srcFiles: this.srcFiles,
      tgtFiles: this.tgtFiles,
      common: this.opt.getCommonOptions(),
      office: this.opt.getOfficeOptions(),
      cat: this.opt.getCatOptions(),
      wwc: this.opt.getWWCOptions(),
    }
    return JSON.stringify(info, null, 2)
  }

  public setFromPreset(preset: PresetOptions): void {
    const modes = preset.mode.split(':')
    this.setModeLarge(modes[0])
    if (modes.length >= 2) {
      this.setModeMiddle(modes[1])
      this.setSource(preset.sourceFiles)
      this.setTarget(preset.targetFiles)
      this.setConsole(preset.console)
      this.setDebug(preset.debug)
      this.setOutputFile(preset.outputFile);
      this.setOfficeOptions(preset.office)
      this.setCatOptions(preset.cat)
      this.setWWCOption(preset.wwc)
    }
  }

  public setConsole(console: boolean | string | undefined | null): void {
    if (console === undefined || console === null) {
      this.hasAnyErr.push('CONSOLE')
    } else if (typeof console === 'string') {
      this.outputParams.console = console === 'true';
    } else {
      this.outputParams.console = console;
    }
  }

  public setDebug(debug: boolean | undefined | null): void {
    if (debug !== undefined && debug !== null) {
      this.outputParams.debug = debug;
    }
  }

  public setSource(src: string | string[] | undefined | null): void {
    if (src !== undefined && src !== null) {
      if (typeof src === 'string') {
        this.source = [src]
      } else {
        this.source = src
      }
    }
    this.setFilesArray('source')
  }

  public setTarget(tgt: string | string[] | undefined | null): void {
    if (tgt !== undefined && tgt !== null) {
      if (typeof tgt === 'string') {
        this.target = [tgt]
      } else {
        this.target = tgt
      }
    }
    if (this.mid.startsWith('ALIGN')) {
      this.setFilesArray('target')
    }
  }

  public setOutputFile(name: string | undefined | null): boolean {
    if (name === undefined || name === null) {
      return false
    } else {
      if (name !== '' && name !== 'console') {
        this.outputFile = name
      } else {
        this.setConsole(true)
      }
      return true
    }
  }

  // ファイルの場所や拡張子等をチェックし、
  // 大分類に応じて処理を実行する
  public async executeByParams(): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      const err = this.validate();
      this.srcData = await path2Buffer(this.srcFiles)
      this.tgtData = await path2Buffer(this.tgtFiles)
      this.addContent(this.srcData)
      this.addContent(this.tgtData)
      if (err !== '') {
        console.log(`Validation Error: ${err}`);
        reject(false);
      } else {
        console.log('----- START EXECUTION -----');
        switch (this.lg) {
          case 'OFFICE':
          case 'COUNT': {
            // const exts = await batchPathContentsReader(this.srcFiles, this.tgtFiles, this.opt)
            // const result = await this.execOfficeOrCount(exts[0], exts[1])
            const result = await this.execOffice()
            this.outlet(result)
            resolve(true)
            break;
          }

          case 'CAT': {
            // const xliffDir = path2Dir(this.srcFiles[0])
            // const xliffNames: string[] = []
            // const xliffStrs: string[] = []
            // this.srcFiles.forEach(file => {
            //   xliffNames.push(path2Name(file))
            //   xliffStrs.push(path2ContentStr(file))
            // })
            // const tsv = createTsvArray(this.tgtFiles)
            // const result = await this.execCat(xliffNames, xliffStrs, tsv)
            // this.outlet(result)
            // resolve(true)
            break;
          }

          default:
            break;
        }
      }
    })
  }

  private outlet(result: string | string[], name?: string) {
    const data = typeof result === 'string' ? result : result.join('\n')
    const filename = name ? name : this.outputFile
    if (this.outputParams.debug) {
      console.log('Success: DEBUG')
    } else if (this.outputParams.console) {
      console.log(data)
    } else {
      writeFileSync(filename, data)
      console.log(`Success: ${this.outputFile}`)
    }
  }

  private validate(): string {
    let errMes = this.hasAnyErr.join('\n');
    this.validated = true;
    if (this.srcFiles.length === 0) {
      errMes += 'No Source Files'
    }
    if (this.mid === 'ALIGN tsv' && this.srcFiles.length !== this.tgtFiles.length) {
      errMes += 'ALIGN File Number Error; ';
    }
    if (!this.outputFile.endsWith(this.recomendFormat)) {
      this.outputFile = `${this.outputFile}.${this.recomendFormat}`
    }
    if (this.hasAnyErr.length > 0) {
      console.log(errMes)
    }
    console.log(this.getSettingInfo())
    return errMes;
  }

  private setFilesArray(srcOrTgt: 'source' | 'target'): void {
    const validFormat = this.lg === 'OFFICE' || this.lg === 'COUNT'
      ? ['docx', 'docm', 'xlsx', 'xlsm', 'pptx', 'pptm', 'pdf', 'json']
      : this.mid === 'UPDATE xliff' ? ['xliff', 'mxliff'] : ['xliff', 'mxliff', 'tmx', 'tbx'];
    const files = srcOrTgt === 'source' ? this.source : this.target;
    const toWhich = srcOrTgt === 'source' ? this.srcFiles : this.tgtFiles;
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
        this.hasAnyErr.push(`${srcOrTgt} files`)
      }
    }
    if (toWhich.length === 0) {
      console.log('No Valid File');
      this.hasAnyErr.push(`${srcOrTgt} files`)
    }
  }
}
