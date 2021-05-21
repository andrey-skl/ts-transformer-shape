import {shape} from '../../../ts-transformer-shape/index';

interface Foo {
  foo: string;
  bar: number;
}
const fooKeys = shape<Foo>();
console.log(fooKeys[0]);

type FooBar = Foo & { bar: number; };
shape<FooBar>().bar;
type FooBarBaz = FooBar | { bar: Function; baz: Date; };
const fooBarBazShape = shape<FooBarBaz>();
console.log('fooBarBazShape', fooBarBazShape)
shape.toString();

class MyClass<T extends object> {
  keys() {
    return shape<T>();
  }
}
