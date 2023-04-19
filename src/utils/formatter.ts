import { timeFormat } from "./timeFormatter";

export class Formatter {
  private static cache: Record<string, any> = {};

  private static getPadding (count: number, char: string = ' ') {
    const cacheKey = char + count;
    if (this.cache[cacheKey]) {
      return this.cache[cacheKey];
    }

    const r = (new Array(count + 1).join(char));
    this.cache[cacheKey] = r;
    return r;
  }

  public static defaultFormatter = new Formatter();

  public static FORMAT_PATTERN =
  // |key          |flag          |width        |precission          |type
  /%\(([a-z]+)\)(?:(-\+|-|\+|0| )?([0-9]+)?(?:\.([0-9]+))?(?=s|d|f))?([s|d|f|o|O])?/g;


  private _format: string;
  private _timeFormat: string;

  public constructor (format?: string, timeFormat?: string) {
    format = format || '%(message)';
    timeFormat = timeFormat || '%Y-%m-%d %H:%M:%S';
    this._format = format;
    this._timeFormat = timeFormat;
  }

  public formatTime (record: any) {
    return timeFormat(new Date(record.created), this._timeFormat);
  }

  public formatError (error: any) {
    const msg = error.toString();
    const stack = typeof error.stack === 'string' ? error.stack : '';
    const file = typeof error.fileName === 'string' ? error.fileName : '';
    const line = typeof error.lineNumber === 'string' ? error.lineNumber : '';
    let s = '';
  
    if (stack) {
      s = stack.indexOf(msg) > -1 ? stack : msg + '\n' + stack;
    }
    else {
      s = msg + (file ? ' in ' + file + ':' + line : '');
    }
  
    return s;
  }

  public format (record: any) {
    const cb = this._getReplacement(record);
    let s = '';
  
    s = this._format.replace(
      Formatter.FORMAT_PATTERN,
      cb
    );
    if (record.error) {
      record.errorText = this.formatError(record.error);
    }
    if (record.errorText) {
      s = s + '\n' + record.errorText;
    }
  
    return s;
  }

  private _getReplacement (record: any, match?: string, key?: string, flag: string = '', width: number = NaN, precision: number = NaN, type: string = '') {
    if (key === 'asctime') {
      return this.formatTime(record);
    }
    if (!key || !record[key]) {
      return '';
    }
  
    let r = '';
  
    r = record[key];
    if (type) {
      if (type === 's') {
        if (!isNaN(precision) && r.length > precision) {
          r = r.slice(0, precision);
        }
  
      }
      else if (type === 'd') {
        let number = parseInt(r, 10);
        r = String(number);
  
        if (precision) {
          var zeroPadding = Formatter.getPadding(precision - r.length, '0');
          r = zeroPadding + r;
        }
  
        if (number > 0 && flag.indexOf('+') > -1) {
          r = '+' + r;
        }
        else if (number > 0 && flag.indexOf(' ') > -1) {
          r = ' ' + r;
        }
  
      }
      else if (type === 'f') {
        let number = parseFloat(r);
        if (!isNaN(precision)) {
          number = parseFloat(number.toFixed(precision));
        }
        r = String(number);
        if (number > 0 && flag.indexOf('+') > -1) {
          r = '+' + r;
        } else if (number > 0 && flag.indexOf(' ') > -1) {
          r = ' ' + r;
        }
      }
  
      if (!isNaN(width) && r.length < width) {
        var paddingChar = flag === '0' && type !== 's' ? '0' : ' ';
        var padding = Formatter.getPadding(width - r.length, paddingChar);
  
        r = flag.indexOf('-') === 0 ? r + padding : padding + r;
      }
    }
  
    return r;
  }

}