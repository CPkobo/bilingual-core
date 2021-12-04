const name = 'numHalf'
const triger: Triger = 'onSetSouce'
const ex = null

const f: OnSetString = (text: string, ex: any): string => {
  return text.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function (s) {
    return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
  })
}

export const plugin: TovisPluginExternal = {
  triger,
  name,
  f,
  ex,
}

// module.exports = plugin