export abstract class Memory {
  public abstract add (data: any): Promise<any>;
  public abstract get (data: any): void;
  public abstract clear (): void;
  public abstract getRelevant (data: any, numRelevant: number): void;
  public abstract getStats (): void;
}