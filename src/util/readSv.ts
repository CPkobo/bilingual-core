// This module needs to be run in client side

import { readFileSync } from 'fs'
import { useErrorMessage } from './util'

export async function path2Buffer(paths: string[]): Promise<ReadData[]> {
  return new Promise((resolve, reject) => {
    const results: ReadData[] = []
    for (const path of paths) {
      try {
        results.push({
          name: path,
          data: readFileSync(path)
        })
      }
      catch {
        const err = useErrorMessage({})
        reject(err)
      }
    }
    resolve(results)
  })
}