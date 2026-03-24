const fs = require('fs')
const path = require('path')
const ts = require(path.join(process.cwd(), 'node_modules', 'typescript'))

const filePath = path.resolve(process.cwd(), 'src', 'app', 'course-modules', 'page.tsx')
const src = fs.readFileSync(filePath, 'utf8')

const sf = ts.createSourceFile(filePath, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)

const diagnostics = ts.getPreEmitDiagnostics(sf)

if (diagnostics.length === 0) {
  console.log('No parse diagnostics from TypeScript.')
  process.exit(0)
}

diagnostics.forEach(d => {
  const { line, character } = sf.getLineAndCharacterOfPosition(d.start || 0)
  const message = ts.flattenDiagnosticMessageText(d.messageText, '\n')
  console.log(`${filePath}:${line + 1}:${character + 1}: ${message}`)
})

process.exit(diagnostics.length > 0 ? 1 : 0)
