const name = 'jpEraToAD'
const triger: Triger = 'onSetSouce'
const ex = null

const f: OnSetString = (text: string, ex: any): string => {
  let processed = text.replace(/元年/g, '1年')
  const era = new RegExp('(明治|大正|昭和|平成|令和)\\s?([0-9０－９]{1,2})年', 'g')
  const mObj: RegExpMatchArray | null = processed.match(era)
  if (mObj === null) {
    return text
  }
  for (const m of mObj) {
    const eraName = m.substr(0, 2)
    const year = Number(m.replace(eraName, '').replace(' ', '').replace('年', ''))
    switch (eraName) {
      case '明治':
        if (year > 0 && year < 45) {
          processed = processed.replace(m, `${year + 1867}年`)
        }
        break
      case '大正':
        if (year > 0 && year < 15) {
          processed = processed.replace(m, `${year + 1911}年`)
        }
        break
      case '昭和':
        if (year > 0 && year < 65) {
          processed = processed.replace(m, `${year + 1925}年`)
        }
        break
      case '平成':
        if (year > 0 && year < 65) {
          processed = processed.replace(m, `${year + 1988}年`)
        }
        break
      case '令和':
        if (year > 0) {
          processed = processed.replace(m, `${year + 2018}年`)
        }
        break

      default:
        break
    }
  }
  return processed
}


const plugin: TovisPluginExternal = {
  triger,
  name,
  f,
  ex
}

export default plugin