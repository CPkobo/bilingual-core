import { OnSetString, TovisPluginExternal } from '../plugins'

const name = 'normalize'

const func: OnSetString = (text: string, ex: any): string => {
  const normalizer = ['NFC', 'NFD', 'NFKC', 'NFKD']
  let method: string = 'NFKD'
  if (typeof (ex) === 'string') {
    if (normalizer.indexOf(ex) !== -1) {
      method = ex
    }
  }
  return text.normalize(ex)
}

const plugin: TovisPluginExternal = {
  triger: ['onSetSouce', 'onSetMT'],
  name,
  f: func,
  ex: 'NFKD'
}

module.exports = plugin