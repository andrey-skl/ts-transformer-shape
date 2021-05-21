import * as ts from 'typescript';
import transformer from '../transformer';

export function compile(filePaths: string[], writeFileCallback?: ts.WriteFileCallback): void {
  const program = ts.createProgram(filePaths, {
    strict: true,
    noEmitOnError: true,
    suppressImplicitAnyIndexErrors: true,
    target: ts.ScriptTarget.ES5
  });
  const transformers: ts.CustomTransformers = {
    before: [transformer(program)],
    after: []
  };
  const { emitSkipped, diagnostics } = program.emit(undefined, writeFileCallback, undefined, false, transformers);

  if (emitSkipped) {
    throw new Error(diagnostics.map(diagnostic => {
      if (typeof diagnostic.messageText === 'string') {
        return diagnostic.messageText;
      }
      return diagnostic.messageText.messageText;
    }).join('\n'));
  }
}
