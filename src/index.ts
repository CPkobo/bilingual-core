import { statSync, readFileSync, writeFileSync } from 'fs'
import { load } from 'js-yaml'

import { CLIController } from './cli/controller'
import { selectLargeDialog, selectOfficeDialog, selectCountDialog, selectCatDialog } from './cli/dialogs'
import { writeDefaultPreset } from './cli/presetter'

// #起動時に処理される部分
console.log('------------------------');
const program = require('commander');
program
  .option('-p, --preset', 'Use this flag for executing with pre-designated params')
  .option('-y, --yaml <item>', 'Designate the yaml file for preset')
  .option('--default-preset', 'Create the default preset file')

const args: any = program.parse(process.argv);

// デフォルトのプリセットファイルの書き出し
if (args.defaultPreset) {
  writeDefaultPreset()
}
// プリセットモードを実行する場合
else if (args.preset) {
  const ctrl = new CLIController()
  // yaml ファイルの正規化
  let presetYaml =
    args.yaml === undefined ? './preset.yaml' :
      (args.yaml.endsWith('.yaml')) || (args.yaml.endsWith('.yml')) ? args.yaml :
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
    catch
    {
      console.log(`${args.yaml} does not exist`);
      presetYaml = './preset.yaml';
    }
  }
  // プリセットファイルの読み込み
  const presetOptions = load(readFileSync(presetYaml).toString()) as PresetOptions;
  ctrl.setFromPreset(presetOptions)
  ctrl.executeByParams();
}
// ダイアログの実行
else {
  const ctrl = new CLIController()
  selectLargeDialog()
    .then(lg => {
      ctrl.setModeLarge(lg)
      switch (lg) {
        case 'DEFAULT PRESET':
          writeDefaultPreset();
          break;

        case 'OFFICE':
          selectOfficeDialog(ctrl, args.args[0]).then(selection => {
            ctrl.executeByParams().catch(() => { console.log('GOT ERROR') })
          })
          break;

        case 'COUNT':
          selectCountDialog(ctrl, args.args[0]).then(selection => {
            ctrl.executeByParams().catch(() => { console.log('GOT ERROR') })
          })
          break;

        case 'CAT':
          selectCatDialog(ctrl, args.args[0]).then(selection => {
            ctrl.executeByParams().catch(() => { console.log('GOT ERROR') })
          })
          break

        default:
          break;
      }
    })
    .catch(() => {
      console.log('Start failed')
    })
}
