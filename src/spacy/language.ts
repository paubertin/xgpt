import { Doc } from "./tokens.js";
import { makeRequest } from "./utils.js";

export class Language {
  public constructor(public model: string, public api = 'http://localhost:8080') {
  }

  public async init () {
    return async (text: string) => {
      const { words, spaces, attrs } = await this.makeDoc(this.model, text, this.api);
      return new Doc(words, spaces, attrs);
    };
  }

  async makeDoc(model: string, text: string, api: string) {
      const json: { tokens: {text: string; whitespace: any }[] } = await makeRequest(api, 'parse', { model, text })
      const words = json.tokens.map(({ text }) => text);
      const spaces = json.tokens.map(({ whitespace }) => Boolean(whitespace));
      return { words, spaces, attrs: Object.assign({}, json, { api }) }
  }
}