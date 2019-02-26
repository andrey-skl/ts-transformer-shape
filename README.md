# ts-transformer-shape
A custom TypeScript transformation to extract object structure from interface

[![Build Status][travis-image]][travis-url]
[![NPM version][npm-image]][npm-url]
[![Downloads](https://img.shields.io/npm/dm/ts-transformer-shape.svg)](https://www.npmjs.com/package/ts-transformer-shape)

# Requirement
TypeScript >= 2.4.1

# How to use this package

This package exports 2 functions.
One is `shape` which is used in TypeScript codes to obtain keys of given type, while the other is a TypeScript custom transformer which is used to compile the `shape` function correctly.

## How to use `shape`

```ts
import { shape } from '@huston007/ts-transformer-shape';

interface Props {
  id: string;
  age: {test: number};
}
const keysOfProps = shape<Props>();

console.log(keysOfProps); // {id: null, age: {test: null}}
```

## How to use the custom transformer

Unfortunately, TypeScript itself does not currently provide any easy way to use custom transformers (See https://github.com/Microsoft/TypeScript/issues/14419).
The followings are the example usage of the custom transformer.

### webpack (with ts-loader or awesome-typescript-loader)

See [examples/webpack](examples/webpack) for detail.

```js
// webpack.config.js
const shapeTransformer = require('@huston007/ts-transformer-shape/transformer').default;

module.exports = {
  // ...
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader', // or 'awesome-typescript-loader'
        options: {
          getCustomTransformers: program => ({
              before: [
                  shapeTransformer(program)
              ]
          })
        }
      }
    ]
  }
};

```

### Rollup (with rollup-plugin-typescript2)

See [examples/rollup](examples/rollup) for detail.

```js
// rollup.config.js
import typescript from 'rollup-plugin-typescript2';
import shapeTransformer from '@huston007/ts-transformer-shape/transformer';

export default {
  // ...
  plugins: [
    typescript({ transformers: [service => ({
      before: [ shapeTransformer(service.getProgram()) ],
      after: []
    })] })
  ]
};

```

### ttypescript

See [examples/ttypescript](examples/ttypescript) for detail.
See [ttypescript's README](https://github.com/cevek/ttypescript/blob/master/README.md) for how to use this with module bundlers such as webpack or Rollup.

```json
// tsconfig.json
{
  "compilerOptions": {
    // ...
    "plugins": [
      { "transform": "ts-transformer-shape/transformer" }
    ]
  },
  // ...
}
```

### TypeScript API

See [test](test) for detail.
You can try it with `$ npm test`.

```js
const ts = require('typescript');
const shapeTransformer = require('@huston007/ts-transformer-shape/transformer').default;

const program = ts.createProgram([/* your files to compile */], {
  strict: true,
  noEmitOnError: true,
  target: ts.ScriptTarget.ES5
});

const transformers = {
  before: [shapeTransformer(program)],
  after: []
};
const { emitSkipped, diagnostics } = program.emit(undefined, undefined, undefined, false, transformers);

if (emitSkipped) {
  throw new Error(diagnostics.map(diagnostic => diagnostic.messageText).join('\n'));
}
```

As a result, the TypeScript code shown [here](#how-to-use-keys) is compiled into the following JavaScript.

```js
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ts_transformer_keys_1 = require("ts-transformer-shape");
var keysOfProps = ["id", "name", "age"];
console.log(keysOfProps); // ['id', 'name', 'age']
```

# Note

* The `keys` function can only be used as a call expression. Writing something like `keys.toString()` results in a runtime error.
* `keys` does not work with a dynamic type parameter, i.e., `keys<T>()` in the following code is converted to an empty array(`[]`).

```ts
class MyClass<T extends object> {
  keys() {
    return keys<T>();
  }
}
```

# License

MIT

[travis-image]:https://travis-ci.org/huston007/ts-transformer-shape.svg?branch=master
[travis-url]:https://travis-ci.org/huston007/ts-transformer-shape
[npm-image]:https://img.shields.io/npm/v/ts-transformer-shape.svg?style=flat
[npm-url]:https://npmjs.org/huston007/ts-transformer-shape
