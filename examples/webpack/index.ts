import {shape} from '@huston007/ts-transformer-shape';
import {type External} from './external-type';

interface Foo {
  foo: string;
}

// NOTICE INTERFACE SHAPE HERE:
shape<Foo>();
// NOTICE EXTERNAL INTERFACE SHAPE HERE:
shape<External>();
