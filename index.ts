export interface AnyObject {
  [k: string]: null | AnyObject | null[] | AnyObject[];
}

export function shape<T extends object>(): AnyObject {
  // This is fake function content. It gets replaced by the transformer
  console.error('@huston007/ts-transformer-shape was not applied by TS compiler! Check configuration');
  return {};
};
