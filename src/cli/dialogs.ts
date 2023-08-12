import { prompt, QuestionCollection } from 'inquirer'

import { CLIController } from './controller'
import type { ModeLarge, ModeMiddleOffice, ModeMiddleCount, ModeMiddleCat } from '../util/params'
import { largeModes, officeModes, countModes, catModes } from '../util/params'

export function selectLargeDialog(): Promise<ModeLarge> {
  console.log('CATOVIS Dialog Interface');
  return new Promise((resolve, reject) => {
    const question: QuestionCollection = [
      {
        type: 'list',
        name: 'modeLg',
        message: 'Select Format',
        choices: largeModes,
      },
    ]
    prompt(question).then((answer: any) => {
      resolve(answer.modeLg as ModeLarge)
    })
  })
}

export function selectOfficeDialog(ctrl: CLIController, sourceFiles?: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const questions: QuestionCollection = [
      {
        type: 'list',
        name: 'modeMd',
        message: 'Select Execution Mode.',
        choices: officeModes,
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
          return answerSoFar.modeMd === 'ALIGN tsv' || answerSoFar.modeMd === 'ALIGN-DIFF html';
        },
      },
      {
        name: 'outputFile',
        message: (answerSoFar: any): string => {
          let format = answerSoFar.modeMd.substring(answerSoFar.modeMd.lastIndexOf(' ') + 1)
          if (format === 'min-tovis') {
            format = 'mtovis'
          }
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
    prompt(questions).then((answer: any) => {
      if (sourceFiles !== undefined) {
        answer.source = sourceFiles;
      }
      ctrl.setModeMiddle(answer.modeMd);
      ctrl.setSource(answer.source);
      ctrl.setTarget(answer.target)
      ctrl.setOutputFile(answer.outputFile)
      if (answer.others.indexOf('DEBUG') !== -1) {
        ctrl.setDebug(true)
      }
      ctrl.setOfficeOptions({
        common: {
          excludePattern: answer.excludePattern,
          withSeparator: answer.others.indexOf('Dont add separation marks') !== -1
        },
        office: {
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
        }
      })
      ctrl.executeByParams();
    });
  })
}

export function selectCountDialog(ctrl: CLIController, sourceFiles?: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const questions: QuestionCollection = [
      {
        type: 'list',
        name: 'modeMd',
        message: 'Select Execution Mode.',
        choices: countModes,
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
    prompt(questions).then((answer: any) => {
      if (sourceFiles !== undefined) {
        answer.source = sourceFiles;
      }
      ctrl.setModeMiddle(answer.modeMd);
      ctrl.setSource(answer.source);
      ctrl.setTarget(answer.target)
      ctrl.setOutputFile(answer.outputFile)
      if (answer.others.indexOf('DEBUG') !== -1) {
        ctrl.setDebug(true)
      }
      ctrl.setOfficeOptions({
        common: {
          excludePattern: answer.excludePattern,
          withSeparator: answer.others.indexOf('Dont add separation marks') !== -1
        },
        office: {
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
        }
      })
      ctrl.executeByParams();
    });
  })
}

export function selectCatDialog(ctrl: CLIController, sourceFiles?: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const questions: QuestionCollection = [
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
    prompt(questions).then((answer: any) => {
      if (sourceFiles !== undefined) {
        answer.source = sourceFiles;
      }
      ctrl.setModeMiddle(answer.modeMd);
      ctrl.setConsole(answer.outputFile === '' && answer.modeMd.startsWith('EXTRACT'))
      ctrl.setSource(answer.source);
      if (answer.target !== undefined) {
        ctrl.setTarget(answer.target)
      }
      ctrl.setOutputFile(answer.outputFile)
      ctrl.executeByParams();
    });
  })
}