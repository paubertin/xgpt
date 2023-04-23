export abstract class Memory {
  public abstract add (data: string): Promise<any>;
  public abstract get (data: string): void;
  public abstract clear (): void;
  public abstract getRelevant (data: string, numRelevant: number): Promise<string[]>;
  public abstract getStats (): void;
}