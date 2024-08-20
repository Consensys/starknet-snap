export type IFilter<Data> = {
  apply(data: Data): boolean;
};

export abstract class Filter<SearchDataType, Data> implements IFilter<Data> {
  search?: SearchDataType;

  constructor(search: SearchDataType) {
    this.search = search;
  }

  apply(data: Data): boolean {
    return this._apply(data);
  }

  protected abstract _apply(data: Data): boolean;
}

export abstract class MultiFilter<SearchDataType, SearchSetDataType, Data>
  implements IFilter<Data>
{
  search: Set<SearchSetDataType> | Map<SearchSetDataType, Data>;

  dataKey: string;

  constructor(
    search:
      | SearchDataType[]
      | Set<SearchSetDataType>
      | Map<SearchSetDataType, Data>,
  ) {
    if (Array.isArray(search)) {
      this._prepareSearch(search);
    } else {
      this.search = search;
    }
  }

  protected abstract _prepareSearch(search: SearchDataType[]): void;

  protected abstract _apply(data: Data): boolean;

  apply(data: Data): boolean {
    if (this.search === undefined) {
      return true;
    }
    return this._apply(data);
  }
}

export abstract class BigIntFilter<DataType> extends MultiFilter<
  string,
  bigint,
  DataType
> {
  protected _prepareSearch(search: string[]): void {
    this.search = new Set(search?.map((val) => BigInt(val)));
  }

  protected _apply(data: DataType): boolean {
    return (
      Object.prototype.hasOwnProperty.call(data, this.dataKey) &&
      this.search.has(BigInt(data[this.dataKey]))
    );
  }
}

export abstract class NumberFilter<DataType> extends MultiFilter<
  number,
  number,
  DataType
> {
  protected _prepareSearch(search: number[]): void {
    this.search = new Set(search);
  }

  protected _apply(data: DataType): boolean {
    return (
      Object.prototype.hasOwnProperty.call(data, this.dataKey) &&
      this.search.has(data[this.dataKey])
    );
  }
}

export abstract class StringFllter<DataType> extends MultiFilter<
  string,
  string,
  DataType
> {
  protected _prepareSearch(search: string[]): void {
    this.search = new Set(search?.map((val) => val.toLowerCase()));
  }

  protected _apply(data: DataType): boolean {
    return (
      Object.prototype.hasOwnProperty.call(data, this.dataKey) &&
      this.search.has(data[this.dataKey].toLowerCase())
    );
  }
}

export class AddressFilter<
  DataType extends {
    address: string;
  },
> extends BigIntFilter<DataType> {
  dataKey = 'address';
}

export class ChainIdFilter<
  DataType extends {
    chainId: string;
  },
> extends BigIntFilter<DataType> {
  dataKey = 'chainId';
}
