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

function mergeUnions(shapes: (ts.ObjectLiteralExpression | ts.NullLiteral | ts.ArrayLiteralExpression)[], typeChecker: ts.TypeChecker): ts.ObjectLiteralExpression | ts.NullLiteral {
  const allKeys = shapes.reduce((acc, o) => {
    if ('elements' in o) {
      // @ts-ignore
      return [...acc, ...o.elements[0].properties];
    }
    if (!('properties' in o)) {
      return acc;
    }
    return [...acc, ...o.properties];
  }, [] as ts.ObjectLiteralElementLike[]);

  const byName = new Map<string, typeof allKeys>();

  allKeys.forEach(prop => {
    if (!prop.name) {
      return;
    }
    // @ts-ignore
    const name = prop.name.text;
    let item = byName.get(name);
    if (!item) {
      byName.set(name, []);
      item = byName.get(name);
    }

    if (item) {
      item.push(prop);
    }
  });

  const uniqueKeys = Array.from(byName.keys());
  const merged = ts.createObjectLiteral(uniqueKeys.map(key => {
    const properties = (byName.get(key) || []);
    const shapeProperties = properties.filter(p => {
      // @ts-ignore
      const initializer = p.initializer;
      if (initializer.properties) {
        return true;
      }
      // @ts-ignore
      return initializer.elements && initializer.elements.every(node => !!node.properties);
    });
    if (shapeProperties.length === 0) {
      return ts.createPropertyAssignment(key, ts.createNull());
    }
    if (shapeProperties.length === 1) {
      return shapeProperties[0];
    }
    // @ts-ignore
    const nodes = shapeProperties.map(v => v.initializer);
    return ts.createPropertyAssignment(key, mergeUnions(nodes, typeChecker));
  }));

  return merged;
}

function handleUnionOrIntersectionType(type: ts.UnionOrIntersectionType, typeChecker: ts.TypeChecker) {
  const possibleTypes: ts.Type[] = type.types;
  if (possibleTypes.some(t => 'types' in t)) {
    return mergeUnions(
      possibleTypes.map(t => walkShape(t, typeChecker)),
      typeChecker
    );
  }
  const shapeTypes = possibleTypes.filter(t => t.symbol);
  if (shapeTypes.length === 0) {
    return ts.createNull();
  }

  if (shapeTypes.length === 1) {
    return walkShape(shapeTypes[0], typeChecker);
  }

  return mergeUnions(
    shapeTypes.map(t => walkShape(t, typeChecker)),
    typeChecker
  );
}

function walkShape(type: ts.Type | ts.UnionOrIntersectionType, typeChecker: ts.TypeChecker): ts.ObjectLiteralExpression | ts.NullLiteral | ts.ArrayLiteralExpression {
  if ('types' in type) {
    return handleUnionOrIntersectionType(type, typeChecker);
  }

  if (!type.symbol || !type.symbol.members) {
    return ts.createNull();
  }

  // TODO: find better way to not walk through native types
  if (['Function', 'Date'].includes(type.symbol.name)) {
    return ts.createNull();
  }

  if (type.symbol.name === 'Array') {
    // @ts-ignore
    return ts.createArrayLiteral([walkShape(type.typeArguments[0], typeChecker)])
  }

  const values: ts.Symbol[] = typeChecker.getAugmentedPropertiesOfType(type);

  return ts.createObjectLiteral(values.map((val: ts.Symbol) => {
    let valueType = typeChecker.getTypeAtLocation(val.valueDeclaration) as ts.Type | ts.UnionOrIntersectionType;

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
  const shape = walkShape(type, typeChecker);

  if (!('properties' in shape)) {
    // we've got no properties, let's return {} instead of 'null'
    return ts.createObjectLiteral([]);
  }

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
