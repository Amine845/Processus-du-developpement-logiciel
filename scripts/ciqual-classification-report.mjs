import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { mapping, classificationReport } from './ciqual-classification.mjs'
import { parseWorkbook } from './ciqual-sync.mjs'
if (process.argv.length !== 3)
  throw new Error('Usage: npm run ciqual:classify:report -- source.xlsx')
const source = readFileSync(process.argv[2])
const foods = await parseWorkbook(source)
console.log(
  JSON.stringify(
    {
      source: mapping.source,
      sourceSha256: createHash('sha256').update(source).digest('hex'),
      ...classificationReport(foods),
    },
    null,
    2,
  ),
)
