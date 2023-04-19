import { Writable } from "stream";
import { Handler } from "./handler";
import { LogLevel } from "./levels";

export class StreamHandler extends Handler {

  private _stream: Writable;
  private _recordTextEnd: string;

  public constructor (stream: Writable = process.stderr, recordTextEnd: string = '\n') {
    super();
    this._stream = stream;
    this._recordTextEnd = recordTextEnd;
  }

  public override emit(record: any) {
    try {
      let data = this.format(record);
      if (this._recordTextEnd && typeof data === 'string') {
        data += this._recordTextEnd;
      }
      return this._stream.write(data);
    }
    catch (err: any) {
      this.handleError(err, record);
    }
  }  

}

export class ConsoleHandler extends Handler {

  private static methodMap = {
    'DEBUG': 'debug',
    'INFO': 'info',
    'WARNING': 'warn',
    'ERROR': 'error',
    'CRITICAL': 'error',
  };

  private _grouping: boolean;
  private _groupMethod: 'group' | 'groupCollapsed';
  private _openGroup: string;

  public constructor (level: LogLevel, grouping = true, collapsed = false) {
    super(level);
    this._grouping = grouping;
    this._groupMethod = collapsed ? 'groupCollapsed' : 'group';
    this._openGroup = '';
  }

  public override emit(record: { name: string; levelname: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' }) {
    const consoleMethod = ConsoleHandler.methodMap[record.levelname] || 'log';
    const consoleMsg = this.format(record);
    const consoleArgs = [ consoleMsg ];
  
    if (this._grouping && record.name !== this._openGroup) {
      if (this._openGroup) {
        console.groupEnd();
      }
  
      this._openGroup = record.name;
      console[this._groupMethod](this._openGroup);
    }
  
    (console as any)[consoleMethod](consoleArgs);
  }  

}