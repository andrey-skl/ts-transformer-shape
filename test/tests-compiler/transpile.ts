import * as ts from 'typescript';
import * as fs from 'fs';
import transformer from '../../transformer';

export function transpile(filePath: string, writeFileCallback?: ts.WriteFileCallback): void {
  const options: ts.CompilerOptions = {
    strict: true,
    noEmitOnError: true,
    suppressImplicitAnyIndexErrors: true,
    target: ts.ScriptTarget.ES5
  };

  const fileContent = fs.readFileSync(filePath, 'utf8');

  const program = ts.createProgram([filePath], options);

  const transformers: ts.CustomTransformers = {
    before: [transformer(program)],
    after: []
  };

  const res = ts.transpileModule(
    fileContent,
    {
      compilerOptions: options,
      transformers,
      reportDiagnostics: true,
      fileName: filePath
    }
  );

  console.log('res', res)
}
