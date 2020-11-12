import { OnSetString, TovisPluginExternal } from '../plugins'

const inputs = [
    '昭和5年に起きたことは、平成5年にも令和5年にも起きる',
    '同様に明治 5年にも大正 5年にも起きていた',
]

const testName = 'jpEraToAd'
const exOption = null

const toTest: TovisPluginExternal = require(`./${testName}`)
for (const input of inputs) {
    const output = toTest.f(input, exOption)
    console.log(output)
}