import { OnSetString, TovisPluginExternal } from '../plugins'

const name = 'numHalf'

const func: OnSetString = (text: string, ex: any): string => {
  return text.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function (s) {
    return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
  })
}

const plugin: TovisPluginExternal = {
  triger: 'onSetSouce',
  name,
  f: func,
  ex: ''
}

module.exports = plugin