import { cpSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..', '..')
const src = resolve(root, 'data')
const dest = resolve(root, 'web', 'src', 'data')

cpSync(src, dest, { recursive: true })

const historyFile = resolve(dest, 'history.json')
if (!existsSync(historyFile)) {
  writeFileSync(historyFile, '[]\n')
} else {
  try {
    const content = JSON.parse(readFileSync(historyFile, 'utf-8'))
    if (!Array.isArray(content)) {
      writeFileSync(historyFile, '[]\n')
    }
  } catch {
    writeFileSync(historyFile, '[]\n')
  }
}

console.log('Data files synced.')
