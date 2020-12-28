import { OnSetString, Triger, TovisPluginExternal } from '../plugins'

const name = 'normalize'
const triger: Triger[] = ['onSetSouce', 'onSetMT']
const ex = 'NFKD'

const f: OnSetString = (text: string, ex: any): string => {
  const normalizer = ['NFC', 'NFD', 'NFKC', 'NFKD']
  let method = 'NFKD'
  if (typeof (ex) === 'string') {
    if (normalizer.indexOf(ex) !== -1) {
      method = ex
    }
  }
  return text.normalize(ex)
}

const plugin: TovisPluginExternal = {
  triger,
  name,
  f,
  ex
}

module.exports = plugin