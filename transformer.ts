import * as ts from 'typescript';

export default function transformer(program: ts.Program): ts.TransformerFactory<ts.SourceFile> {
  return (context: ts.TransformationContext) => (file: ts.SourceFile) => visitNodeAndChildren(file, program, context);
}

function visitNodeAndChildren(node: ts.SourceFile, program: ts.Program, context: ts.TransformationContext): ts.SourceFile;
function visitNodeAndChildren(node: ts.Node, program: ts.Program, context: ts.TransformationContext): ts.Node;
function visitNodeAndChildren(node: ts.Node, program: ts.Program, context: ts.TransformationContext): ts.Node {
  try {
    return ts.visitEachChild(visitNode(node, program, context), childNode => visitNodeAndChildren(childNode, program, context), context);
  } catch (error: unknown) {
    // Detailed error output:
    const file = node.getSourceFile().fileName;
    console.error(`=== Error when processing: ${file} ===
=== node: ${node.getText()} ===`);

    throw error;
  }
}

function isESSYmbol(s: ts.Symbol) {
  return s.name.startsWith('__@');
}

function mergeUnions(
  shapes: (ts.ObjectLiteralExpression | ts.NullLiteral | ts.ArrayLiteralExpression)[],
  typeChecker: ts.TypeChecker,
  context: ts.TransformationContext
): ts.ObjectLiteralExpression | ts.NullLiteral {
  const factory = context.factory;
  const allKeys = shapes.reduce((acc, o) => {
    if ('elements' in o) {
      // @ts-expect-error
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
  const merged = factory.createObjectLiteralExpression(uniqueKeys.map(key => {
    const properties = (byName.get(key) || []);
    const shapeProperties = properties.filter(p => {
      const initializer = p.initializer;
      if (initializer.properties) {
        return true;
      }
      // @ts-expect-error
      return initializer.elements && initializer.elements.every(node => !!node.properties);
    });
    if (shapeProperties.length === 0) {
      return factory.createPropertyAssignment(key, context.factory.createNull());
    }
    if (shapeProperties.length === 1) {
      return shapeProperties[0];
    }
    const nodes = shapeProperties.map(v => v.initializer);
    return factory.createPropertyAssignment(key, mergeUnions(nodes, typeChecker, context));
  }));

  return merged;
}

function handleUnionOrIntersectionType(
  type: ts.UnionOrIntersectionType,
  typeChecker: ts.TypeChecker,
  context: ts.TransformationContext
) {
  const possibleTypes: ts.Type[] = type.types;
  if (possibleTypes.some(t => 'types' in t)) {
    return mergeUnions(
      possibleTypes.map(t => walkShape(t, typeChecker, context)),
      typeChecker,
      context
    );
  }
  const shapeTypes = possibleTypes
    .filter(t => t.symbol)
    .filter(t => {
      const props = t.getProperties();
      return !(props.length > 0 && props.every(isESSYmbol));
    })
  if (shapeTypes.length === 0) {
    return context.factory.createNull();
  }

  if (shapeTypes.length === 1) {
    return walkShape(shapeTypes[0], typeChecker, context);
  }

  return mergeUnions(
    shapeTypes.map(t => walkShape(t, typeChecker, context)),
    typeChecker,
    context
  );
}

function walkShape(
  type: ts.Type | ts.UnionOrIntersectionType,
  typeChecker: ts.TypeChecker,
  context: ts.TransformationContext
): ts.ObjectLiteralExpression | ts.NullLiteral | ts.ArrayLiteralExpression {
  if ('types' in type) {
    return handleUnionOrIntersectionType(type, typeChecker, context);
  }

  if (!type.symbol || !type.symbol.members) {
    return context.factory.createNull();
  }

  // TODO: find better way to not walk through native types
  if (['Function', 'Date'].includes(type.symbol.name)) {
    return context.factory.createNull();
  }

  if (type.symbol.name === 'Array') {
    return context.factory.createArrayLiteralExpression([walkShape((type as any).typeArguments[0], typeChecker, context)])
  }

  const values: ts.Symbol[] = typeChecker.getAugmentedPropertiesOfType(type)
    .filter(v => !isESSYmbol(v));

  return context.factory.createObjectLiteralExpression(values.map((val: ts.Symbol) => {
    if (!val.valueDeclaration) {
      throw new Error(`No valueDeclaration found for ${val.escapedName}`);
    }
    let valueType = typeChecker.getTypeAtLocation(val.valueDeclaration) as ts.Type | ts.UnionOrIntersectionType;

    // @ts-expect-error
    if (valueType.intrinsicName === 'error') {
      // @ts-expect-error
      throw new Error(`No type details available for ${val.parent.escapedName}[${val.escapedName}]. Are you using transpileOnly: true? Then you may not reference types in another files.`);
    }

    try {
      return context.factory.createPropertyAssignment(val.name, walkShape(valueType, typeChecker, context));
    } catch (error: any) {
      if (error.message === 'Maximum call stack size exceeded') {
        throw new Error(`
>>>   "ts-transformer-shape" error: ${error.message}
>>>   IN: "${type.symbol?.escapedName}", where "${val.valueDeclaration?.getText()}" is declared.
>>>   DID YOU WRITE A TYPE THAT HAS CIRCULAR REFERENCE???
`);
      }
      throw error;
    }
  }));
}

function visitNode(node: ts.Node, program: ts.Program, context: ts.TransformationContext): ts.Node {
  const typeChecker = program.getTypeChecker();
  if (!isShapeCallExpression(node, typeChecker)) {
    return node;
  }
  if (!node.typeArguments) {
    return context.factory.createArrayLiteralExpression([]);
  }
  const type = typeChecker.getTypeFromTypeNode(node.typeArguments[0]);

  // @ts-expect-error
  if (type.intrinsicName === 'error') {
    // @ts-expect-error
    throw new Error(`Failed to retrieve type details for "shape<${node.typeArguments[0].typeName.escapedText}>". You may need to declare type in same file if use with "transpileOnly: true".`);
  }

  const shape = walkShape(type, typeChecker, context);

  if (!('properties' in shape)) {
    // we've got no properties, let's return {} instead of 'null'
    return context.factory.createObjectLiteralExpression([]);
  }

  return shape;
}

function isShapeCallExpression(node: ts.Node, typeChecker: ts.TypeChecker): node is ts.CallExpression {
  if (!ts.isCallExpression(node)) {
    return false;
  }

  const name = (node.expression as ts.Identifier)?.escapedText ?? '';

  //@ts-expect-error
  const imports: StringLiteral[] = node.getSourceFile().imports;

  const shapeImport = imports.find(it => it.text.includes('ts-transformer-shape'));

  if (!shapeImport) {
    return false;
  }

  const importBindings = shapeImport.parent.importClause.namedBindings;

  if (importBindings?.elements.some((it: any) => it.name.escapedText === name)) {
    return true;
  }

  return false;
}
