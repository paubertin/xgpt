import { getSimilarity } from "./utils";

export class Doc {
  private _doc: { cats?: any; is_tagged?: boolean; is_parsed?: boolean; is_sentenced?: boolean };
  private _tokens: any[];
  private _ents: any[];
  private _sents: any[];
  private _chunks: any[];
  private _model?: string;
  private _api?: string;

  public tokens: Token[];
  public cats?: any;
  public isTagged?: boolean;
  public isParsed?: boolean;
  public isSentenced?: boolean;

  public constructor(words: string[], spaces: any[], attrs: {
    doc?: { cats?: any; is_tagged: boolean };
    tokens?: any[];
    ents?: any[];
    sents?: any[];
    noun_chunks?: any[];
    model?: string;
    api?: string;
  } = {}) {
      this._doc = attrs.doc || {};
      this._tokens = attrs.tokens || [];
      this._ents = attrs.ents || [];
      this._sents = attrs.sents || [];
      this._chunks = attrs.noun_chunks || [];
      this._model = attrs.model;
      this._api = attrs.api;
      this.tokens = words.map((word, i) => new Token(this, word, spaces[i], this._tokens[i]))
      for (let i = 0; i < this.tokens.length; i++) {
          this[i] = this.tokens[i];
      }
      this.cats = this._doc.cats;
      this.isTagged = this._doc.is_tagged;
      this.isParsed = this._doc.is_parsed;
      this.isSentenced = this._doc.is_sentenced;
  }

  inspect() {
      return this.text;
  }

  get text() {
      let text = '';
      for (let token of this.tokens) {
          text += token.textWithWs;
      }
      return text;
  }

  get length() {
      return this.tokens.length;
  }

  get ents() {
      return this._ents.map(({ start, end, label }) => new Span(this, start, end, label));
  }

  get sents() {
      return this._sents.map(({ start, end }) => new Span(this, start, end));
  }

  get nounChunks() {
      return this._chunks.map(({ start, end }) => new Span(this, start, end));
  }

  *[Symbol.iterator]() {
      let i = 0;
      while (this.tokens[i] !== undefined) {
          yield this.tokens[i];
          ++i;
      }
  }

  toString() {
      return this.text;
  }

  map(func: (t: Token) => Token) {
      let tokens: Token[] = [];
      for (let token of this) {
          tokens.push(func(token));
      }
      return tokens;
  }

  slice(start, end) {
      return new Span(this, start, end);
  }

  async similarity(obj) {
      return await getSimilarity(this._api!, this._model!, this.text, obj.text);
  }
}

export class Span {
  public doc: any;
  public start: any;
  public end: any;
  private _label: any;
  public tokens: any;

  constructor(doc: any, start: any, end: any, label?: any) {
      this.doc = doc;
      this.start = start;
      this.end = end;
      this._label = label;
      this.tokens = [...this.doc].slice(this.start, this.end);
      for (let i = 0; i < this.tokens.length; i++) {
          this[i] = this.tokens[0];
      }
  }

  get text() {
      let text = '';
      for (let token of this.tokens) {
          text += token.textWithWs;
      }
      return text.trim();
  }

  get length() {
      return this.tokens.length;
  }

  get label() {
      if (this._label) {
          return this._label;
      }
      // Manually check if span is an entity
      for (let ent of this.doc.ents) {
          if (ent.start === this.start && ent.end == this.end) {
              return ent.label;
          }
      }
  }

  *[Symbol.iterator]() {
      let i = 0;
      while (this.tokens[i] !== undefined) {
          yield this.tokens[i];
          ++i;
      }
  }

  slice(start, end) {
      return new Span(this, start, end);
  }

  toString() {
      return this.text;
  }

  inspect() {
      return this.text;
  }

  async similarity(obj) {
      return await getSimilarity(this.doc._api, this.doc._model, this.text, obj.text);
  }
}

export class Token {
  public doc: any;
  public whitespace: any;
  public text: any;
  public textWithWs: any;
  public orth: any;
  public i: any;
  public entType: any;
  public entIob: any;
  public lemma: any;
  public norm: any;
  public lower: any;
  public shape: any;
  public prefix: any;
  public suffix: any;
  public pos: any;
  public tag: any;
  public dep: any;
  public isAlpha: any;
  public isAscii: any;
  public isDigit: any;
  public isLower: any;
  public isUpper: any;
  public isTitle: any;
  public isPunct: any;
  public isLeftPunct: any;
  public isRightPunct: any;
  public isSpace: any;
  public isBracket: any;
  public isCurrency: any;
  public likeUrl: any;
  public likeNum: any;
  public likeEmail: any;
  public isOov: any;
  public isStop: any;
  public isSentStart: any;

  private _head: any;

  constructor(doc: any, word: any, space: any, attrs: Record<string, any> = {}) {
      this.doc = doc;
      this.whitespace = space ? ' ' : '';
      this.text = word;
      this.textWithWs = this.text + this.whitespace;
      this.orth = attrs.orth;
      this.i = attrs.i;
      this.entType = attrs.ent_type;
      this.entIob = attrs.ent_iob;
      this.lemma = attrs.lemma;
      this.norm = attrs.norm;
      this.lower = attrs.lower;
      this.shape = attrs.shape,
      this.prefix = attrs.prefix;
      this.suffix = attrs.suffix;
      this.pos = attrs.pos;
      this.tag = attrs.tag;
      this.dep = attrs.dep;
      this.isAlpha = attrs.is_alpha;
      this.isAscii = attrs.is_ascii;
      this.isDigit = attrs.is_digit;
      this.isLower = attrs.is_lower;
      this.isUpper = attrs.is_upper;
      this.isTitle = attrs.is_title;
      this.isPunct = attrs.is_punct;
      this.isLeftPunct = attrs.is_left_punct;
      this.isRightPunct = attrs.is_right_punct;
      this.isSpace = attrs.is_space;
      this.isBracket = attrs.is_bracket;
      this.isCurrency = attrs.is_currency;
      this.likeUrl = attrs.like_url;
      this.likeNum = attrs.like_num;
      this.likeEmail = attrs.like_email;
      this.isOov = attrs.is_oov;
      this.isStop = attrs.is_stop;
      this.isSentStart = attrs.is_sent_start;

      this._head = attrs.head;
  }

  get length() {
      return this.text.length;
  }

  get head() {
      return this.doc[this._head];
  }

  toString() {
      return this.text;
  }

  inspect() {
      return this.text;
  }

  async similarity(obj) {
      return await getSimilarity(this.doc._api, this.doc._model, this.text, obj.text);
  }
}