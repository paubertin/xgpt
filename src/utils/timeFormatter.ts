const TimeFormatter = {
  validate: (time: Date) => {
    if (!time || time.getTime() !== time.getTime()) {
		  throw new Error('Argument time of strftime is not a valid time.');
    }
  },
  iso: (time: Date, format: string) => {
    return format.replace(/%ISO/g, () => time.toISOString());
  },
  map: {
		'a': '_notImplemented',
		'A': '_notImplemented',
		'b': '_notImplemented',
		'B': '_notImplemented',
		'c': 'toLocaleString',
		'd': 'getDay',
		'H': 'getHour',
		'I': 'get12Hour',
		'j': '_notImplemented',
		'm': 'getMonth',
		'M': 'getMinute',
		'p': 'getAmpm',
		'S': 'getSecond',
		's': 'getTimestamp',
		'U': '_notImplemented',
		'w': '_notImplemented',
		'W': '_notImplemented',
		'x': 'toLocaleDateString',
		'X': 'toLocaleTimeString',
		'y': 'getYear',
		'Y': 'getFullYear',
		'Z': '_notImplemented',
	},
  RE: /%(.)/g,
  toLocaleString: (time: Date) => time.toLocaleString(),
  toLocaleDateString: (time: Date) => time.toLocaleDateString(),
  toLocaleTimeString: (time: Date) => time.toLocaleTimeString(),
  getDay: (time: Date) => {
    let res = `${time.getUTCDate()}`;
    res = TimeFormatter.twoDigits(res);
    return res;
  },
  getHour: (time: Date) => {
    let res = `${time.getUTCHours()}`;
    res = TimeFormatter.twoDigits(res);
    return res;
  },
  get12Hour: (time: Date) => {
    let res: string | number = time.getUTCHours();
    if (res > 12) {
      res = res - 12;
    }
    res = `${res}`;
    res = TimeFormatter.twoDigits(res);
    return res;
  },
  getMonth: (time: Date) => {
    let res = `${time.getUTCMonth() + 1}`;
    res = TimeFormatter.twoDigits(res);
    return res;
  },
  getMinute: (time: Date) => {
    let res = `${time.getUTCMinutes()}`;
    res = TimeFormatter.twoDigits(res);
    return res;
  },
  getAmPm: (time: Date) => {
    let res = time.getUTCHours();
    return res >= 12 ? 'PM' : 'AM';
  },
  getSecond: (time: Date) => {
    let res = `${time.getUTCSeconds()}`;
    res = TimeFormatter.twoDigits(res);
    return res;
  },
  getTimestamp: (time: Date) => {
    let res = Math.floor(time.getTime() / 1000);
    return `${res}`;
  },
  getYear: (time: Date) => {
    let res = `${time.getUTCFullYear()}`;
    res = TimeFormatter.twoDigits(res);
    return res;
  },
  getFullYear: (time: Date) => {
    let res = `${time.getUTCFullYear()}`;
    return res;
  },
  getReplacement: (time: Date, match: any, directive: string) => {
    if (directive === '%') {
      return '%';
    }
    if (directive in TimeFormatter.map) {
      return (TimeFormatter.map as any)[directive](time);
    }
    return directive;
  },
  twoDigits: (s: string) => {
    if (s.length < 2) {
      s = '0' + s;
    }
    else if (s.length > 2) {
      s = s.slice(-2);
    }
    return s;
  },
  _notImplemented: (time: Date) => {
    console.warn('This feature is not implemented');
    return '';
  }
};

export function timeFormat (time: Date, format: string) {
  TimeFormatter.validate(time);
  format = TimeFormatter.iso(time, format);
  const cb = TimeFormatter.getReplacement.bind(TimeFormatter, time);
  const result = format.replace(TimeFormatter.RE, cb);
  return result;
}