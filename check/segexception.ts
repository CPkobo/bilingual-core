function splitSegmentation(text: string, delimiters: RegExp): string[] {
  const t = text.replace(delimiters, '$1\n');
  const ts: string[] = []
  const exceptions = new RegExp('((Mr)|(Ms)|(No)|(Co)|(co)|(etc))\\. $')
  let tv = ''
  const vs = t.split('\n')
  console.log(vs)
  for (let i = 0; i < vs.length; i++) {
    const v = vs[i]
    tv += v
    if (tv === '' || exceptions.test(tv)) {
      continue
    } else {
      ts.push(tv)
      tv = ''
    }
  }
  if (tv !== '') {
    ts.push(tv)
  }
  return ts;
}

const delim = new RegExp('(。|！|？|(\\. )|(\\! )|(\\? ))', "g")
const doc = "私がMr. 余です。よろしくお願いいたします。"
console.log(splitSegmentation(doc, delim))