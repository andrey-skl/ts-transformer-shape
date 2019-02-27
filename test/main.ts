import { shape } from '../index';
import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import { compile } from './compile';

describe('shape', () => {
  type FooBar = {
    foo: string;
    bar?: number;
  };
  interface BarBaz {
    bar: Function;
    baz: Date;
  }

  it('should give empty object for empty type', () => {
    assert.deepStrictEqual(shape<{}>(), {});
  });

  it('should give empty object for any type', () => {
    assert.deepStrictEqual(shape<any>(), {});
  });

  it('should construct shape of simple type', () => {
    interface Foo {
      foo: string;
    }
    assert.deepStrictEqual(shape<Foo>(), {foo: null});
  });

  it('should construct shape of deep interface', () => {
    interface Inner {
      bar: string;
    }
    interface Foo {
      foo: string;
      test: {
        str: string;
      }
      inner: Inner
    }
    assert.deepStrictEqual(shape<Foo>(), {
      foo: null,
      test: {
        str: null
      },
      inner: {
        bar: null
      }
    });
  });

  it('should construct shape of array values', () => {
    interface Foo {
      str: string;
      foo: string[];
      inn: BarBaz[]
    }
    assert.deepStrictEqual(shape<Foo>(), {str: null, foo: [null], inn: [{bar: null, baz: null}]});
  });

  it('should construct shape of optional primitive types', () => {
    interface Test {
      foo?: number;
    }
    assert.deepStrictEqual(shape<Test>(), {foo: null});
  });

  it('should construct deep shape of optional object types', () => {
    interface Test {
      foo?: {test: string};
    }
    assert.deepStrictEqual(shape<Test>(), {foo: {test: null}});
  });

  it('should construct deep shape of nullable object types', () => {
    interface Test {
      foo: null | {test: string};
    }
    assert.deepStrictEqual(shape<Test>(), {foo: {test: null}});
  });

  it('should construct empty shape with any', () => {
    assert.deepStrictEqual(shape<FooBar & any>(), {});
    assert.deepStrictEqual(shape<FooBar | any>(), {});
  });

  it('should construct shape of extending interface', () => {
    interface Parent {foo: string;}
    interface Child extends Parent {bar: number;}
    assert.deepStrictEqual(shape<Child>(), {foo: null, bar: null});
  });

  it('should construct shape of interface with property that is extending interface', () => {
    interface Parent {foo: string;}
    interface Child extends Parent {bar: number;}
    interface Test {
      str: string,
      child: Child;
    }
    assert.deepStrictEqual(shape<Test>(), {str: null, child: {foo: null, bar: null}});
  });

  const fileTransformationDir = path.join(__dirname, 'fileTransformation');
  fs.readdirSync(fileTransformationDir).filter((file) => path.extname(file) === '.ts').forEach((file) =>
    it(`transforms ${file} as expected`, () => {
      let result = '';
      const fullFileName = path.join(fileTransformationDir, file), postCompileFullFileName = fullFileName.replace(/\.ts$/, '.js');
      compile([fullFileName], (fileName, data) => postCompileFullFileName === path.join(fileName) && (result = data));
      assert.strictEqual(result.replace(/\r\n/g, '\n'), fs.readFileSync(postCompileFullFileName, 'utf-8'));
    }).timeout(0)
  );
});
