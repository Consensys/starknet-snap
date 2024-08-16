export type IFilter<Data> = {
  apply(data: Data): boolean;
};

export abstract class Filter<SearchDataType, Data> implements IFilter<Data> {
  search?: SearchDataType;

  optional = false;

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
  search?: SearchDataType[];

  optional = false;

  searchSet: Set<SearchSetDataType>;

  dataKey: string;

  constructor(search: SearchDataType[]) {
    this.search = search;
    this._prepareSearch();
  }

  protected abstract _prepareSearch();

  protected abstract _apply(data: Data): boolean;

  apply(data: Data): boolean {
    if (this.search === undefined && this.optional) {
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
  protected _prepareSearch(): void {
    this.searchSet = new Set(this.search?.map((val) => BigInt(val)));
  }

  protected _apply(data: DataType): boolean {
    return (
      Object.prototype.hasOwnProperty.call(data, this.dataKey) &&
      this.searchSet.has(BigInt(data[this.dataKey]))
    );
  }
}

export abstract class NumberFilter<DataType> extends MultiFilter<
  number,
  number,
  DataType
> {
  protected _prepareSearch(): void {
    this.searchSet = new Set(this.search);
  }

  protected _apply(data: DataType): boolean {
    return (
      Object.prototype.hasOwnProperty.call(data, this.dataKey) &&
      this.searchSet.has(data[this.dataKey])
    );
  }
}

export abstract class StringFllter<DataType> extends MultiFilter<
  string,
  string,
  DataType
> {
  protected _prepareSearch(): void {
    this.searchSet = new Set(this.search?.map((val) => val.toLowerCase()));
  }

  protected _apply(data: DataType): boolean {
    return (
      Object.prototype.hasOwnProperty.call(data, this.dataKey) &&
      this.searchSet.has(data[this.dataKey].toLowerCase())
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
