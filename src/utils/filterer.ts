type Filtertype = { filter: (record: any) => any; [key: string]: any } | ((record: any) => any);

export class Filterer {
  protected filters: Filtertype[] = [];

  public constructor () {}

  public addFilter (filter: Filtertype) {
    if (!this.filters.includes(filter)) {
      this.filters.push(filter);
    }
  }

  public removeFilter (filter: Filtertype) {
    const idx = this.filters.indexOf(filter);
    if (idx >= 0) {
      this.filters.splice(idx, 1);
    }
  }

  public filter (record: any) {
    let res = true;
    let result;
    for (const f of this.filters) {
      if (typeof f === 'function') {
        result = f(record);
      }
      else {
        result = f.filter(record);
      }
      if (!result) {
        res = false;
        break;
      }
    }
    return res;
  }
}