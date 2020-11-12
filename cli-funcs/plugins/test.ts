import { OnSetString, TovisPluginExternal } from '../plugins'

const name = 'numHalf'

const func: OnSetString = (text: string, ex: any): string => {
  return `${text}::${ex}`
}

const plugin: TovisPluginExternal = {
  triger: 'onSetSouce',
  name,
  f: func,
  ex: ''
}

module.exports = plugin