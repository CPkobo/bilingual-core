const fs = require('fs')
const xml2js = require('xml2js')

const mxliffPath = './_local/test.mxliff'
const xliffPath = './_local/test.xliff'
const tmxPath = './_local/test.tmx'
const tbxPath = './_local/test.tbx'

const path = tmxPath

// const xmlStr = fs.readFileSync(xliffPath).toString()
const xmlStr = fs.readFileSync(path).toString()
xml2js.parseString(xmlStr, (err, result) => {
    if (path.endsWith('xliff')) {
        const xliff = result.xliff
        const file = xliff.file[0]
        const body = file.body[0]
        let tus = []
        if (body.group) {
            body.group.map(g => {
                tus.push(...g['trans-unit'])
            })
        }
        else {
            tus.push(...body['trans-unit'])
        }
        tus.forEach(tu => {
            console.log(tu.source)
        })
        fs.writeFileSync(path + '.json', JSON.stringify(xliff, null, 2))
    }
    else if (path.endsWith('tmx')) {
        const tmx = result.tmx
        const headers = tmx.header
        const bodies = tmx.body
        // console.log(headers[0].prop)
        // console.log(bodies[0].tu[0].tuv[0].prop)
        fs.writeFileSync(path + '.json', JSON.stringify(tmx, null, 2))
    }
    else if (path.endsWith('tbx')) {
        const martif = result.martif
        const texts = martif.text
        const bodies = texts[0].body
        const entries = bodies[0].termEntry
        // console.log(entries[0].langSet[0].tig[0].termNote)
        fs.writeFileSync(path + '.json', JSON.stringify(martif, null, 2))
    }
    // console.log(xliff.file[0].body[0]['trans-unit'][0].note)
    // console.log(xliff.$)
})