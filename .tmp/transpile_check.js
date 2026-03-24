const fs=require('fs');const path=require('path');const ts=require(path.join(process.cwd(),'node_modules','typescript'));
const file=path.join(process.cwd(),'src','app','course-modules','page.tsx');
const src=fs.readFileSync(file,'utf8');
const out=ts.transpileModule(src,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX, target:ts.ScriptTarget.ES2020, module:ts.ModuleKind.ESNext}, fileName:file});
if(out.diagnostics&&out.diagnostics.length){out.diagnostics.forEach(d=>{const m=ts.flattenDiagnosticMessageText(d.messageText,'\n'); const pos=d.start||0; const {line,character}=ts.createSourceFile(file,src,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX).getLineAndCharacterOfPosition(pos); console.log(`ERR ${line+1}:${character+1}: ${m}`)}); process.exit(1);} console.log('No diagnostics from transpileModule.');
