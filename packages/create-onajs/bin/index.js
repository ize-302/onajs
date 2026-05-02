#!/usr/bin/env node
import {
  existsSync, mkdirSync, readdirSync,
  statSync, copyFileSync, readFileSync, writeFileSync
} from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createInterface } from 'node:readline'

const templateDir = join(dirname(fileURLToPath(import.meta.url)), '../template')

// Files that need renaming on copy (npm strips/mangles these during publish)
const RENAMES = {
  '_package.json': 'package.json',
  '_gitignore': '.gitignore',
}

function copyDir(src, dest) {
  mkdirSync(dest, { recursive: true })
  for (const entry of readdirSync(src)) {
    const srcPath = join(src, entry)
    const destName = RENAMES[entry] ?? entry
    const destPath = join(dest, destName)
    statSync(srcPath).isDirectory()
      ? copyDir(srcPath, destPath)
      : copyFileSync(srcPath, destPath)
  }
}

async function prompt(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans.trim()) }))
}

async function main() {
  let name = process.argv[2]
  if (!name) name = await prompt('Project name: ')
  if (!name) { console.error('Project name is required'); process.exit(1) }

  const target = join(process.cwd(), name)
  if (existsSync(target)) {
    console.error(`"${name}" already exists`)
    process.exit(1)
  }

  copyDir(templateDir, target)

  const pkgPath = join(target, 'package.json')
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
  pkg.name = name
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')

  console.log(`\nScaffolded ${name}/\n`)
  console.log(`  cd ${name}`)
  console.log(`  npm install`)
  console.log(`  npm run dev\n`)
}

main().catch(e => { console.error(e.message); process.exit(1) })
