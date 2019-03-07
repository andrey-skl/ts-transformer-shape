import * as ts from 'typescript';
import * as path from 'path';

export default function transformer(program: ts.Program): ts.TransformerFactory<ts.SourceFile> {
  return (context: ts.TransformationContext) => (file: ts.SourceFile) => visitNodeAndChildren(file, program, context);
}

function visitNodeAndChildren(node: ts.SourceFile, program: ts.Program, context: ts.TransformationContext): ts.SourceFile;
function visitNodeAndChildren(node: ts.Node, program: ts.Program, context: ts.TransformationContext): ts.Node;
function visitNodeAndChildren(node: ts.Node, program: ts.Program, context: ts.TransformationContext): ts.Node {
  return ts.visitEachChild(visitNode(node, program), childNode => visitNodeAndChildren(childNode, program, context), context);
}

function walkShape(type: ts.Type, typeChecker: ts.TypeChecker): ts.ObjectLiteralExpression | ts.NullLiteral {
  if (!type.symbol || !type.symbol.members) {
    return ts.createNull();
  }

  // TODO: find better way to not walk through native types
  if (['Function', 'Date'].includes(type.symbol.name)) {
    return ts.createNull();
  }

  const values: ts.Symbol[] = typeChecker.getAugmentedPropertiesOfType(type);

  return ts.createObjectLiteral(values.map((val: ts.Symbol) => {
    let valueType = typeChecker.getTypeAtLocation(val.valueDeclaration);

    // Handle optional types like {foo?: string}, {foo: null | string}
    // @ts-ignore
    const possibleTypes = valueType.types;
    if (possibleTypes) {
      const betterType = possibleTypes.filter((t: ts.Type) => !!t.symbol)[0];
      if (betterType) {
        valueType = betterType;
      }
    }

    if (valueType.symbol && valueType.symbol.name === 'Array') {
      return ts.createPropertyAssignment(
        val.name,
        // @ts-ignore
        ts.createArrayLiteral([walkShape(valueType.typeArguments[0], typeChecker)])
      );
    }

    return ts.createPropertyAssignment(val.name, walkShape(valueType, typeChecker));
  }));
}

function visitNode(node: ts.Node, program: ts.Program): ts.Node {
  const typeChecker = program.getTypeChecker();
  if (!isShapeCallExpression(node, typeChecker)) {
    return node;
  }
  if (!node.typeArguments) {
    return ts.createArrayLiteral([]);
  }

  const type = typeChecker.getTypeFromTypeNode(node.typeArguments[0]);
  if (!type.symbol) {
    return ts.createObjectLiteral([]);
  }
  const shape = walkShape(type, typeChecker);
  return shape;
}

const indexTs = path.join(__dirname, 'index.ts');
function isShapeCallExpression(node: ts.Node, typeChecker: ts.TypeChecker): node is ts.CallExpression {
  if (node.kind !== ts.SyntaxKind.CallExpression) {
    return false;
  }
  const signature = typeChecker.getResolvedSignature(node as ts.CallExpression);
  if (typeof signature === 'undefined') {
    return false;
  }
  const { declaration } = signature;
  return !!declaration
    && (path.join(declaration.getSourceFile().fileName) === indexTs)
    && !!declaration['name']
    && (declaration['name'].getText() === 'shape');
}
