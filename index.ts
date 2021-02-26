export interface AnyObject {
  [k: string]: null | AnyObject | null[] | AnyObject[];
}

export function shape<T extends object>(): AnyObject {
  // This is fake function content. It gets replaced by the transformer
  return {};
};
