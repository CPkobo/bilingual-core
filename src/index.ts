import { statSync, readFileSync, writeFileSync } from 'fs'
import { load } from "js-yaml"

import { CLIController } from './controller'
import { selectLargeDialog, selectOfficeDialog, selectCountDialog, selectCatDialog } from './dialogs'
import { writeDefaultPreset } from './presetter'
import type { ModeLarge, ModeMiddleOffice, ModeMiddleCount, ModeMiddleCat } from './office-funcs/params'
import { largeModes, officeModes, countModes, catModes } from './office-funcs/params'

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
  const ctrl = new CLIController()
  // yaml ファイルの正規化
  let presetYaml =
    args.yaml === undefined ? './preset.yaml' :
      args.yaml.endsWith('.yaml') ? args.yaml :
        args.yaml.endsWith('.yml') ? args.yaml :
          `${args.yaml}.yaml`;
  // 指定ファイルの存在を確認する。
  // なかった場合は presets フォルダを確認し、それでもなければ'./preset.yaml' を使用する
  try {
    statSync(presetYaml);
  }
  catch {
    try {
      statSync(`./presets/${presetYaml}`);
      presetYaml = `./presets/${presetYaml}`;
    }
    catch {
      console.log(`${args.yaml} does not exist`);
      presetYaml = './preset.yaml';
    }
  }
  // プリセットファイルの読み込み
  const presetOptions = load(readFileSync(presetYaml).toString()) as PresetOptions;
  ctrl.setFromPreset(presetOptions)
  // ctrl.setMode1(yo.mode)
  // ctrl.setSource(yo.sourceFiles)
  // ctrl.setTarget(yo.targetFiles)
  // ctrl.setConsole(yo.console)
  // ctrl.setDebug(yo.debug)
  // ctrl.setOutputFile(yo.outputFile);
  // ctrl.setOfficeOptions(yo.office)
  // ctrl.setCatOptions(yo.cat)
  // ctrl.setWWCOption(yo.wwc)
  ctrl.executeByParams();
} else {
  // ダイアログの実行
  const ctrl = new CLIController()
  const a = selectLargeDialog()
    .then(lg => {
      ctrl.setModeLarge(lg)
      switch (lg) {
        case 'DEFAULT PRESET':
          writeDefaultPreset();
          break;

        case 'OFFICE':
          selectOfficeDialog(ctrl, args.args[0]).then(selection => {
            ctrl.executeByParams().catch(() => { console.log("GOT ERROR") })
          })
          break;

        case 'COUNT':
          selectCountDialog(ctrl, args.args[0]).then(selection => {
            ctrl.executeByParams().catch(() => { console.log("GOT ERROR") })
          })
          break;

        case 'CAT':
          selectCatDialog(ctrl, args.args[0]).then(selection => {
            ctrl.executeByParams().catch(() => { console.log("GOT ERROR") })
          })
          break

        default:
          break;
      }
    })
    .catch(() => {
      console.log("Start failed")
    })
}
