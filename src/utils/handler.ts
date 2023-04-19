import { Filterer } from "./filterer";
import { Formatter } from "./formatter";
import { LogLevel } from "./levels";

export abstract class Handler extends Filterer {
  protected _name?: string;
  protected _closed: boolean = false;
  
  protected _level: LogLevel;
  protected _formatter?: Formatter;

  public constructor (level: LogLevel = LogLevel.NOTSET) {
    super();
    this._level = level;
  }

  public setLevel (level: LogLevel) {
    this._level = level;
  }

  public isEnabledFor (level: LogLevel) {
    return level >= this._level;
  }

  public setFormatter (formatter: Formatter) {
    this._formatter = formatter;
  }

  public format (record: any) {
    const formatter = this._formatter ?? Formatter.defaultFormatter;
    return formatter.format(record);
  }

  public handle (record: any) {
    const rv = this.filter(record);
    if (rv) {
      this.emit(record);
    }
    return rv;
  }

  public handleError (error: any, record: any = null) {
    if (typeof console === 'object') {
      console.error(`An error ${error.toString()} has occurred${record ? ` during handling the record ${record.message}` : ''}`);
    }
  }

  public abstract emit (record: any): any;

  public flush (): any {}

  public close (): any {}
}