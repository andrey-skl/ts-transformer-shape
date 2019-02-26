export interface AnyObject {
  [k: string]: null | AnyObject | null[] | AnyObject[];
}

export declare function shape<T extends object>(): AnyObject;
