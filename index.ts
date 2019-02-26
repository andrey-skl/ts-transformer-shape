interface anyObject {
  [k: string]: null | anyObject;
}

export declare function shape<T extends object>(): anyObject;
