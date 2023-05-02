import { Config } from "../config";
import { getAdaEmbedding } from "../llm.utils";
import { Memory } from "./base";
import weaviate, { WeaviateClient } from 'weaviate-ts-client';
import weaviateEmbedded, { EmbeddedClient as WeaviateEmbeddedClient, EmbeddedOptions } from './weaviate/index';
import { v4 as uuidv4 } from 'uuid';

export class WeaviateMemory extends Memory {
  private _client: WeaviateClient | WeaviateEmbeddedClient;
  private _embedded: boolean = false;
  private _index: string;

  public constructor() {
    super();
    if (Config.useWeaviateEmbedded) {
      this._embedded = true;
      this._client = weaviateEmbedded.client(
        new EmbeddedOptions({
          host: Config.weaviateHost,
          port: Config.weaviatePort,
          version: 'latest',
        }),
        {
          host: `${Config.weaviateHost}:${Config.weaviatePort}`,
          scheme: Config.weaviateProtocol,
        }
      );
    }
    else {
      this._client = weaviate.client({
        host: `${Config.weaviateHost}:${Config.weaviatePort}`,
        scheme: Config.weaviateProtocol,
        authClientSecret: this._buildAuthCredentials(),
        apiKey: this._buildApiKey(),
      });
    }
    this._index = WeaviateMemory.formatClassName(Config.memoryIndex);
  }

  public static formatClassName (index: string) {
    index = index.replaceAll('-', '_');
    return index.toUpperCase();
  }

  private async _createSchema () {
    const schema = {
      class: this._index,
      properties: [
          {
              name: "rawText",
              dataType: ["text"],
              description: "original text for the embedding",
          }
      ],
    };

    try {
      const existing = await this._client.schema
        .classGetter()
        .withClassName(this._index)
        .do();
    }
    catch (err: any) {
      await this._client.schema
        .classCreator()
        .withClass(schema)
        .do();
    }
  }

  private _buildAuthCredentials () {
    if (Config.weaviateUserName && Config.weaviatePassword) {
      return new weaviate.AuthUserPasswordCredentials({
        username: Config.weaviateUserName,
        password: Config.weaviatePassword,
      });
    }
    return undefined;
  }

  private _buildApiKey () {
    if (Config.weaviateAPIKey) {
      return new weaviate.ApiKey(Config.weaviateAPIKey);
    }
    return undefined;
  }

  protected override async _init(): Promise<void> {
    if (this._embedded) {
      await (this._client as WeaviateEmbeddedClient).embedded.start();
    }
    await this._createSchema();
  }

  protected override async _shutdown(): Promise<void> {
    if (this._embedded) {
      (this._client as WeaviateEmbeddedClient).embedded.stop();
    }
  }

  public override async _add(data: string): Promise<any> {
    const vector = await getAdaEmbedding(data);
    // const uuidv4 = uuid.v4(data);
    // const id = uuidv5(data, this._index);
    const id = uuidv4();
    await this._client.data
      .creator()
      .withClassName(this._index)
      .withId(id)
      .withProperties({
        rawText: data,
      })
      .withVector(vector)
      .do();
    return `Inserting data into memory at uuid: ${id}:\n data: ${data}`;
  }

  protected override async _get(text: string) {
    return this._getRelevant(text, 1);
  }

  public override async _clear(): Promise<void> {
    const classes = (await this._client.schema.getter().do()).classes?.map((c) => c.class) ?? [];
    for (const c of classes) {
      if (c) {
        await this._client.schema
          .classDeleter()
          .withClassName(c)
          .do();
      }
    }
  }

  public override async _getRelevant(data: string, numRelevant: number): Promise<string[]> {
    const queryEmbedding = await getAdaEmbedding(data);
    try {
      const raw = await this._client.graphql
        .get()
        .withClassName(this._index)
        .withFields('rawText')
        .withNearVector({ vector: queryEmbedding, certainty: 0.7 })
        .withLimit(numRelevant)
        .do();
      const results = raw.data.Get?.[this._index] ?? [];
      return results.map((r) => r.rawtext);
    }
    catch (err: any) {
      console.error(`Unexpected error: ${err}`);
      return [];
    }
  }

  public override async _getStats(): Promise<any> {
    const raw = await this._client.graphql
      .aggregate()
      .withClassName(this._index)
      .withFields('meta { count }')
      .do();

    const result = raw.data.Aggregate?.[this._index]?.[0]?.['meta'] ?? {};
    return result;
  }
}