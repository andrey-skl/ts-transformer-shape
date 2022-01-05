import { shape as s} from '../../index';

s();

interface Foo {
  foo: string;
}
const fooShape = s<Foo>();
console.log(fooShape);

type FooBar = Foo & { bar: number; };
s<FooBar>();
type FooBarBaz = FooBar | { bar: Function; baz: Date; };
const fooBarBazShape = s<FooBarBaz>();
console.log('fooBarBazShape', fooBarBazShape)

function shape() {
  return '';
}
const a = shape();

shape.toString();

class MyClass<T extends object> {
  keys() {
    return s<T>();
  }
}
