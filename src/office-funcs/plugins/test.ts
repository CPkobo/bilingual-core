const name = 'numHalf'
const triger: Triger = "onSetSouce"
const ex = null

const f: OnSetString = (text: string, ex: any): string => {
  let test: string =ex.str
  for (let i = 0; i < ex.times; i ++) {
    test += ex.str
  }
  return `${text}::${test}`
}

export const plugin: TovisPluginExternal = {
  triger,
  name,
  f,
  ex
}

// module.exports = plugin