import { readFileSync } from 'fs'

export type testFunc = (text: string) => Promise<string[]>;

export class MyPlugins {
  public funcs: testFunc[]

  constructor() {
    this.funcs = []
  }

  public registerFunction(scriptPath: string): void {
    const myScript = readFileSync(scriptPath).toString()
    const myFunc = eval(myScript)
    console.log(myFunc)
    myFunc('hoge')
    this.funcs.push(myFunc)
  }

  public execFuncs(): void {
    if (this.funcs.length === 0) {
      console.log('no functions')
    } else {
      for (const f of this.funcs) {
        f('text')
      }
    }
  }
}

const pl = new MyPlugins()
pl.registerFunction('./firstPL.js')
pl.execFuncs()
