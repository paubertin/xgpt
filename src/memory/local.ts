import { Config } from "../config";
import { createEmbeddingWithAda } from "../llm.utils";
import { Memory } from "./base";
import nj from '@d4c/numjs';
import fs from 'fs';

function argSort (a: any, axis: number = -1, kind?: any, order?: any) {
  // _wrapfunc(a, 'argsort', axis=axis, kind=kind, order=order)
}

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

export class LocalCache extends Memory {
  private _fileName: string;
  private _data: CacheContent;

  public constructor () {
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

  public override async add(text: string) {
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
    }
    catch (err: any) {
      throw new Error('could not write to file');
    }
    return text;
  }

  public override async get(text: string) {
    return this.getRelevant(text, 1);
  }

  public override clear(): void {
    this._data = new CacheContent();
  }

  public override async getRelevant(text: string, numRelevant: number) {
    const embedding = await createEmbeddingWithAda(text);

    const scores = nj.dot(this._data.embeddings, embedding);

    console.error('scores', scores);

    throw new Error("Method not implemented.");
    const topKIndices = scores.hi(2);
  }
  public override getStats(): void {
    throw new Error("Method not implemented.");
  }
  
}