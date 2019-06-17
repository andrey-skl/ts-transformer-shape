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


  it('should construct shape of simple union type', () => {
    interface Foo {
      foo: string;
    }
    interface Bar {
      bar: string
    }
    assert.deepStrictEqual(shape<Foo | Bar>(), {foo: null, bar: null});
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

  it('should construct shape of interface with "string | some array" property', () => {
    interface Something {
      id: string;
    }
    interface Test {
      foo: Something[] | string;
    }

    assert.deepStrictEqual(shape<Test>(), {foo: [{id: null}]});
  });

  it('should construct shape of interface with union of simple types', () => {
    interface Test {
      foo: number | string;
    }

    assert.deepStrictEqual(shape<Test>(), {foo: null});
  });

  it('should construct simple intersect shape of unions', () => {
    interface A {
      foo: number;
      bar: string;
    }
    interface B {
      bar: number;
    }
    interface Test {
      tst: A | B;
    }

    assert.deepStrictEqual(shape<Test>(), {tst: {foo: null, bar: null}});
  });

  it('should construct simple intersection shape', () => {
    interface A {
      foo: number;
      bar: string;
    }
    interface B {
      bar: number;
      another: boolean;
    }
    interface Test {
      tst: A & B;
    }

    assert.deepStrictEqual(shape<Test>(), {tst: {foo: null, bar: null, another: null}});
  });

  it('should construct deep intersection shape', () => {
    interface A {
      foo: number;
    }
    type B = A & {
      bar: string;
    }
    interface Test {
      tst: B
    }

    assert.deepStrictEqual(shape<Test>(), {tst: {foo: null, bar: null}});
  });

  it('should construct very deep intersection shape', () => {
    interface Base1 {id: string;}
    interface Base2 {id2: string;}
    type Union = Base1 | Base2;

    type A = (Union) & {
      id3: number;
    }

    assert.deepStrictEqual(shape<A>(), {id: null, id2: null, id3: null});
  });

  it('should construct simple deep shape of unions', () => {
    interface A {
      bar: string;
    }
    interface B {
      bar: {
        inner: boolean;
      };
    }
    interface Test {
      tst: A | B;
    }

    assert.deepStrictEqual(shape<Test>(), {tst: {bar: {inner: null}}});
  });

  it('should construct veru deep shape of unions', () => {
    interface A {
      bar: {
        a: number;
        inner: {
          inner1: string;
          inner2: number;
        };
      };
    }
    interface B {
      bar: {
        inner: {
          inner1: string;
        };
      };
    }
    interface Test {
      tst: A | B;
    }

    assert.deepStrictEqual(shape<Test>(), {
      tst: {
        bar: {
          a: null,
          inner: {
            inner1: null,
            inner2: null
          }
        }
      }
    });
  });

  it('should construct shape of unions with intersecting props', () => {
    interface A {
      foo1: string;
      foo2: {b: string};
    }
    interface B {
      foo2: string;
    }
    interface Test {
      tst: A | B;
    }

    assert.deepStrictEqual(shape<Test>(), {tst: {foo1: null, foo2: {b: null}}});
  });


  it('should construct shape of union array', () => {
    interface A {
      foo: number;
    }
    interface B {
      bar: number;
    }
    type OneOf = A | B;
    interface Test {
      tst: OneOf[];
    }

    assert.deepStrictEqual(shape<Test>(), {tst: [{foo: null, bar: null}]});
  });


  it('should construct shape of deep union array', () => {
    interface Item {
      test: string;
    }
    interface A {
      foo: Item[];
    }
    interface B {
      foo: string[];
      bar: number;
    }
    type OneOf = A | B;

    assert.deepStrictEqual(shape<OneOf>(), {foo: [{test: null}], bar: null});
  });


  it('should construct deep inheritance and union', () => {
    interface Comment {
      id: string;
      textPreview: string;
    }

    interface Item {
      id: string;
      name: string;
    }

    interface Base {
      category: {id: string};
    }

    interface CommentItem extends Base {
      category: {id: 'foo'};
      added: Comment[];
    }

    interface ContentItem extends Base {
      category: {id: 'bar'};
      added: string;
    }

    interface FieldItem extends Base {
      category: {id: 'test'};
      added: Item[];
    }

    type AnyItem = CommentItem | ContentItem | FieldItem;
    const res = shape<AnyItem>();

    assert.deepStrictEqual(res, {
      category: {id: null},
      added: {id: null, textPreview: null, name: null}
    });
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
