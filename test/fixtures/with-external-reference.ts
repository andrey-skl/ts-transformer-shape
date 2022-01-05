import {shape} from '../../../ts-transformer-shape/index';
import {External} from '../utils/external-types';

interface CompositeType {
  simple: string;
  referenced: External;
}

alert(shape<CompositeType>().referenced);
