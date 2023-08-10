// import QaNum from "./plugins/qa/QaNum"
// import QaTerm from "./plugins/qa/QaTerm"
import plugin from "./plugins/jpEraToAD"
import jpEraToAD from "./plugins/jpEraToAD"
import normalize from "./plugins/normalize"
import numHalf from "./plugins/numHalf"

// export type onSetSource = (text: string) => string;
// export type onSetMT = (text: string) => string;
// export type onQA = (text: string) => string;

export class BuiltinPlugins {
  static plugins: string[] = [
    // "QaNum",
    // "QATerm",
    "jpEraToAD",
    "normalize",
    "numHalf"
  ]
  public onSetSouce: TovisPlugin[]
  public onSetMT: TovisPlugin[]
  public onQA: TovisPlugin[]

  constructor() {
    this.onSetSouce = []
    this.onSetMT = []
    this.onQA = []
  }

  public register(activates: string | string[], ex: string): void {
    const actives: string[] = typeof activates === 'string' ? [activates] : activates
    for (const active of actives) {
      if (BuiltinPlugins.plugins.includes(active)) {
        let plugin: TovisPluginExternal;
        switch (active) {
          case "jpEraToAD":
            plugin = jpEraToAD
            break;

          case "normalize":
            plugin = normalize

          case "numHalf":
            plugin = numHalf

          default:
            break;
        }
      }
      const trigers: Triger[] = typeof plugin.triger === 'string' ? [plugin.triger] : plugin.triger
      for (const triger of trigers) {
        const myPlugin: TovisPlugin = {
          name: plugin.name,
          f: plugin.f,
          ex: ""
        }
        switch (triger) {
          case 'onSetSouce':
            this.onSetSouce.push(myPlugin)
            break;
          case 'onSetMT':
            this.onSetMT.push(myPlugin)
            break;
          case 'onQA':
            this.onQA.push(myPlugin)
            break;
          default:
            break;
        }
      }
    }
  }

  public execFuncs(triger: Triger, text: string): string {
    let processed = text
    const toExecutes = triger === 'onSetSouce' ? this.onSetSouce
      : triger === 'onSetMT' ? this.onSetMT : this.onQA
    for (const toExecute of toExecutes) {
      processed = toExecute.f(processed, toExecute.ex)
    }
    return processed
  }
}

// const pl = new MyPlugins()
// pl.register('./plugins/normalize.js')
// console.log(pl.execFuncs('onSetSouce', '（ａｉｕｅｏとaiueo）'))