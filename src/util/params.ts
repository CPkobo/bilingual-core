export const largeModes = [
    'OFFICE', 'COUNT', 'CAT', 'DEFAULT PRESET'
] as const

export const officeModes = [
    'EXTRACT txt', 'ALIGN tsv', 'ALIGN-DIFF html',
    'EXTRACT json', 'EXTRACT-DIFF json', 'EXTRACT-DIFF tovis', 'EXTRACT-DIFF min-tovis'
] as const

export const countModes = [
    'CHARAS tsv', 'WORDS tsv', 'DIFF-CHARAS tsv', 'DIFF-WORDS tsv'
] as const

export const catModes = [
    'EXTRACT tsv',
    'EXTRACT-DIFF json', 'EXTRACT-DIFF tovis', 'EXTRACT-DIFF min-tovis',
    'UPDATE xliff', 'REPLACE xliff'
] as const

export const modeCombinations = [
    'OFFICE:EXTRACT txt', 'OFFICE:EXTRACT json', 'OFFICE:EXTRACT-DIFF json',
    'OFFICE:EXTRACT-DIFF tovis', 'OFFICE:EXTRACT-DIFF min-tovis',
    'OFFICE:ALIGN tsv', 'OFFICE:ALIGN-DIFF html',
    'COUNT:CHARAS tsv', 'COUNT:WORDS tsv',
    'COUNT:DIFF-CHARAS tsv', 'COUNT:DIFF-WORDS tsv',
    'CAT:EXTRACT tsv',
    'CAT:EXTRACT-DIFF json', 'CAT:EXTRACT-DIFF tovis', 'CAT:EXTRACT-DIFF min-tovis',
    'CAT:UPDATE xliff', 'CAT:REPLACE xliff'
] as const

export type ModeLarge = typeof largeModes[number]

export type ModeMiddleOffice = typeof officeModes[number]
export type ModeMiddleCount = typeof countModes[number]
export type ModeMiddleCat = typeof catModes[number]

export type ModeCombinations = typeof modeCombinations[number]