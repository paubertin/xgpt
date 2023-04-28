export abstract class Memory {
  protected static _instance: Memory;
  protected static _initialized: boolean = false;

  protected constructor () {}
  protected abstract _init (): Promise<void>;
  protected abstract _shutdown (): Promise<void>;
  protected abstract _add (data: string): Promise<any>;
  protected abstract _get (data: string): Promise<any>;
  protected abstract _clear (): Promise<void>;
  protected abstract _getRelevant (data: string, numRelevant: number): Promise<string[]>;
  protected abstract _getStats (): Promise<any>;

  public static get instance () {
    if (!this._instance) {
      throw new Error('Memory not initialized');
    }
    return this._instance;
  }

  public static async init <T extends Memory>(type: (new () => T)) {
    if (this._initialized) {
      return this._instance;
    }
    this._instance = new type();
    await this._instance._init();
    this._initialized = true;
    return this._instance as T;
  }

  public static async shutdown () {
    await this.instance._shutdown();
  }

  public static async add (data: string): Promise<any> { return await this.instance._add(data); }
  public static async get (data: string): Promise<any> { return this.instance._get(data); }
  public static async clear (): Promise<void> { this.instance._clear(); }
  public static async getRelevant (data: string, numRelevant: number): Promise<string[]> { return await this.instance._getRelevant(data, numRelevant); }
  public static async getStats (): Promise<any> { return this.instance._getStats(); }
}