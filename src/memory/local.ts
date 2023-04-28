import { Config } from "../config";
import { createEmbeddingWithAda } from "../llm.utils";
import { Memory } from "./base";
import nj from '@d4c/numjs';
import fs from 'fs';

const EMBED_DIM = 1536;

function createDefaultEmbeddings () {
  return nj.zeros([0, EMBED_DIM], 'int32');
}

class CacheContent {
  public texts: string[] = [];
  public embeddings: nj.NdArray = createDefaultEmbeddings();

  public constructor (data?: any) {
    if (Array.isArray(data?.texts)) {
      if (data.texts.every((line: any) => typeof line === 'string')) {
        this.texts = data.texts;
      }
      else {
        throw new Error();
      }
    }
  }
}

let decor = (v: any, i: any) => [v, i];          // set index to value
let undecor = (a: any) => a[1];               // leave only index
let argsort = (arr: any) => arr.map(decor).sort().map(undecor);

export class LocalCache extends Memory {
  private _fileName: string;
  private _data: CacheContent;

  public constructor () {
    if (Memory.instance) {
      throw new Error('Memory already instanciated');
    }
    super();
    this._fileName = `${Config.memoryIndex}.json`;
    if (fs.existsSync(this._fileName)) {
      try {
        let fileContent = fs.readFileSync(this._fileName).toString().trim();
        if (!fileContent) {
          fileContent = '{}';
          fs.writeFileSync(this._fileName, fileContent);
        }
        try {
          const data = JSON.parse(fileContent);
          this._data = new CacheContent(data);
        }
        catch (err: any) {
          throw new Error('Failed to parse file content');
        }
      }
      catch (err: any) {
        console.error('Failed to init local cache');
        this._data = new CacheContent();
      }
    }
    else {
      console.warn(`The file ${this._fileName} does not exist.`);
      this._data = new CacheContent();
    }
  }

  protected override async _init(): Promise<void> {}
  protected override async _shutdown(): Promise<void> {}

  protected override async _add(text: string) {
    if (text.includes('Command Error:')) {
      return;
    }
    this._data.texts.push(text);
    const embedding = await createEmbeddingWithAda(text);
    const vector = nj.array(embedding, 'float32');
    this._data.embeddings = nj.concatenate(
      this._data.embeddings,
      vector,
    );

    try {
      const file = await fs.promises.open(this._fileName, 'w');
      await file.write(JSON.stringify(this._data));
      await file.close();
    }
    catch (err: any) {
      throw new Error('could not write to file');
    }
    return text;
  }

  protected override async _get(text: string) {
    return this._getRelevant(text, 1);
  }

  protected override async _clear() {
    this._data = new CacheContent();
  }

  protected override async _getRelevant(text: string, numRelevant: number): Promise<string[]> {
    try {

      const embedding = await createEmbeddingWithAda(text);
      const scores = nj.dot(this._data.embeddings, embedding);
      
      let sorted: Int32Array = argsort(scores.selection.data);
      const arr = Array.from(sorted).splice(-numRelevant);
      arr.reverse();
      return arr.map((i) => this._data.texts[i]);
    }
    catch (err) {
      return [];
    }
  }

  protected override async _getStats() {
    return {
      length: this._data.texts.length,
      shape: this._data.embeddings.shape,
    };
  }
  
}