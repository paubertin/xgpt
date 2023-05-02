export abstract class VoiceEngine {
  protected static _instance: VoiceEngine;
  protected static _initialized: boolean = false;

  protected constructor () {}
  protected abstract _init (): void;
  protected abstract _speech (text: string): Promise<boolean>;

  public static get instance () {
    if (!this._instance) {
      throw new Error('VoiceBase not initialized');
    }
    return this._instance;
  }

  public static init <T extends VoiceEngine>(type: (new () => T)) {
    if (this._initialized) {
      return this._instance;
    }
    this._instance = new type();
    this._instance._init();
    this._initialized = true;
    return this._instance as T;
  }

  public static async say (text: string) {
    return this.instance._speech(text);
  }

}