// thanks to https://github.com/beenotung/best-effort-json-parser.git

export function tryParse(s: string): any {
  try {
    return JSON.parse(s);
  }
  catch (e) {
    const [data, reminding] = parseAny(s, e);
    if (reminding.length) {
      throw e;
    }
    return data;
  }
}

function parseAny(s: string, e: unknown): ParseResult<any> {
  const parser = parsers[s[0]];
  if (!parser) {
    console.error(`no parser registered for ${JSON.stringify(s[0])}:`, { s });
    throw e;
  }
  return parser(s, e);
}

type Code = string;
type Parser<T> = (s: Code, e: unknown) => ParseResult<T>;
type ParseResult<T> = [T, Code];

const parsers: Record<string, Parser<any>> = {};

function skipSpace(s: string): string {
  return s.trimStart();
}

parsers[' '] = parseSpace;
parsers['\r'] = parseSpace;
parsers['\n'] = parseSpace;
parsers['\t'] = parseSpace;

function parseSpace(s: string, e: unknown) {
  s = skipSpace(s);
  return parseAny(s, e);
}

parsers['['] = parseArray;

function parseArray(s: string, e: unknown): ParseResult<any[]> {
  s = s.substring(1); // skip starting '['
  const acc: any[] = [];
  s = skipSpace(s);
  for (; s.length > 0; ) {
    if (s[0] === ']') {
      s = s.substring(1); // skip ending ']'
      break;
    }
    const res = parseAny(s, e);
    acc.push(res[0]);
    s = res[1];
    s = skipSpace(s);
    if (s[0] === ',') {
      s = s.substring(1);
      s = skipSpace(s);
    }
  }
  return [acc, s];
}

for (const c of '0123456789.-'.slice()) {
  parsers[c] = parseNumber;
}

function parseNumber(s: string): ParseResult<number | string> {
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (parsers[c] === parseNumber) {
      continue;
    }
    const num = s.substring(0, i);
    s = s.substring(i);
    return [numToStr(num), s];
  }
  return [numToStr(s), ''];
}

function numToStr(s: string) {
  if (s === '-') {
    return -0;
  }
  const num = +s;
  if (Number.isNaN(num)) {
    return s;
  }
  return num;
}

parsers['"'] = parseString;

function parseString(s: string): ParseResult<string> {
  for (let i = 1; i < s.length; i++) {
    const c = s[i];
    if (c === '\\') {
      i++;
      continue;
    }
    if (c === '"') {
      const str = s.substring(0, i + 1);
      s = s.substring(i + 1);
      return [JSON.parse(str), s];
    }
  }
  return [JSON.parse(s + '"'), ''];
}

parsers['{'] = parseObject;

function parseObject(s: string, e: unknown): ParseResult<object> {
  s = s.substring(1); // skip starting '{'
  const acc: any = {};
  s = skipSpace(s);
  for (; s.length > 0; ) {
    if (s[0] === '}') {
      s = s.substring(1); // skip ending '}'
      break;
    }

    const keyRes = parseAny(s, e);
    const key = keyRes[0];
    s = keyRes[1];

    s = skipSpace(s);
    if (s[0] !== ':') {
      acc[key] = undefined;
      break;
    }
    s = s.substring(1); // skip ':'
    s = skipSpace(s);

    if (s.length === 0) {
      acc[key] = undefined;
      break;
    }
    const valueRes = parseAny(s, e);
    acc[key] = valueRes[0];
    s = valueRes[1];
    s = skipSpace(s);

    if (s[0] === ',') {
      s = s.substring(1);
      s = skipSpace(s);
    }
  }
  return [acc, s];
}

parsers['t'] = parseTrue;

function parseTrue(s: string, e: unknown): ParseResult<true> {
  return parseToken(s, `true`, true, e);
}

parsers['f'] = parseFalse;

function parseFalse(s: string, e: unknown): ParseResult<false> {
  return parseToken(s, `false`, false, e);
}

parsers['n'] = parseNull;

function parseNull(s: string, e: unknown): ParseResult<null> {
  return parseToken(s, `null`, null, e);
}

function parseToken<T>(
  s: string,
  tokenStr: string,
  tokenVal: T,
  e: unknown,
): ParseResult<T> {
  for (let i = tokenStr.length; i >= 1; i--) {
    if (s.startsWith(tokenStr.slice(0, i))) {
      return [tokenVal, s.slice(i)];
    }
  }
  throw e;
}