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

  it('should construct shape of optional types', () => {
    assert.deepStrictEqual(shape<FooBar>(), {foo: null, bar: null});
  });

  // it('should construct shape of union', () => {
  //   assert.deepStrictEqual(shape<FooBar & BarBaz>(), {foo: null, bar: null, baz: null});
  // });

  // it('should construct shape of joint', () => {
  //   assert.deepStrictEqual(shape<FooBar | BarBaz>(), {bar: null});
  // });

  it('should construct shape with any', () => {
    assert.deepStrictEqual(shape<FooBar & any>(), {});
    assert.deepStrictEqual(shape<FooBar | any>(), {});
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
