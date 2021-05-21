import {shape} from '@huston007/ts-transformer-shape';

interface Foo {
  foo: string;
}

// NOTICE INTERFACE SHAPE HERE:
shape<Foo>();
