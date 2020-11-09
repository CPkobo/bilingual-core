const d = require('difflib')
const seg1 = 'これは原文です。'
const seg2 = 'これは訳文ですね。'

const m = new d.SequenceMatcher(null, seg1, seg2)
console.log(m.ratio())
console.log(m.getGroupedOpcodes())