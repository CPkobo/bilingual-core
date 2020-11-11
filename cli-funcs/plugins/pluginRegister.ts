import { readFileSync } from 'fs'

type testFunc = (text: string) => string;

interface ObjPlugin {
  type: string
  name: string
  f: testFunc
}

class MyPlugins {
  public funcs: testFunc[]

  constructor() {
    this.funcs = []
  }

  public registerFunction(scriptPath: string | string[]): void {
    if (typeof(scriptPath) === 'string') {
      const myFunc = require(scriptPath)
      this.funcs.push(myFunc)
    } else {
      for (const path of scriptPath) {
        const myFunc = require(path)
        this.funcs.push(myFunc)
      }
    }
  }

  public registerObjFunction(scriptPath: string): void {
    const myObjFunc: ObjPlugin = require(scriptPath)
    this.funcs.push(myObjFunc.f)
  }

  public execFuncs(): void {
    if (this.funcs.length === 0) {
      console.log('no functions')
    } else {
      for (const f of this.funcs) {
        console.log(f('text'))
      }
    }
  }
}

const pl = new MyPlugins()
pl.registerFunction('./firstPL.js')
pl.registerFunction('./secondPL.js')
pl.registerFunction(['./firstPL.js', './secondPL.js'])
pl.registerObjFunction('./thirdPL.js')
pl.execFuncs()
