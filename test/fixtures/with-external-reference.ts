import {shape} from '../../index';
import {External} from '../utils/external-types';

interface CompositeType {
  simple: string;
  referenced: External;
}

alert(shape<CompositeType>().referenced);
