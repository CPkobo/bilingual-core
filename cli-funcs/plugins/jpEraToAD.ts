import { OnSetString, TovisPluginExternal } from '../plugins'

const name = 'jpEraToAD'

const func: OnSetString = (text: string, ex: any): string => {
  return text.normalize('NFKD')
}

const plugin: TovisPluginExternal = {
  triger: 'onSetSouce',
  name,
  f: func,
  ex: ''
}

module.exports = plugin