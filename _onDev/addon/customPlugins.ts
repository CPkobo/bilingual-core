import { statSync, readFileSync } from 'fs'

// export type onSetSource = (text: string) => string;
// export type onSetMT = (text: string) => string;
// export type onQA = (text: string) => string;

export class MyPlugins {
  public onSetSouce: TovisPlugin[]
  public onSetMT: TovisPlugin[]
  public onQA: TovisPlugin[]

  constructor() {
    this.onSetSouce = []
    this.onSetMT = []
    this.onQA = []
  }

  public register(scriptPath: string | string[], ex: string): void {
    const paths: string[] = typeof (scriptPath) === 'string' ? [scriptPath] : scriptPath
    for (const path of paths) {
      try {
        statSync(path)
      } catch (e) {
        console.log(`${path} does not exists...`)
        continue
      }
      const myPluginEx: TovisPluginExternal = require(path)
      const trigers: Triger[] = typeof (myPluginEx.triger) === 'string' ? [myPluginEx.triger] : myPluginEx.triger
      for (const triger of trigers) {
        const myPlugin: TovisPlugin = {
          name: myPluginEx.name,
          f: myPluginEx.f,
          ex: ex.startsWith('{') ? JSON.parse(ex) : ex
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