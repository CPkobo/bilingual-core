import { Tovis } from '../cli-funcs/tovis'
import { writeFileSync } from 'fs'

const tovis = new Tovis()
// tovis.parseFromFile('./demo.tovis', 'tovis').then((successMessage) => {
tovis.parseFromFile('../demo.tovis', 'tovis').then((successMessage) => {
    console.log(successMessage)
    const jsonStr = tovis.dumpToJson()
    const tovisStr = tovis.dump()
    writeFileSync('./parsedemo.json', jsonStr)
    writeFileSync('./parsedemo.tovis', tovisStr.join('\n'))
}).catch((errMessage) => {
    console.log('-----An Error has occurred-----')
    console.log(errMessage)
    console.log('-------------------------------')
})