import logUpdate from 'log-update';

export class Spinner {
  private id?: NodeJS.Timer;

  private schema = {
		'interval': 80,
		'frames': [
			'⠋',
			'⠙',
			'⠹',
			'⠸',
			'⠼',
			'⠴',
			'⠦',
			'⠧',
			'⠇',
			'⠏'
		]
	};

  public start (text: string) {
    let i = 0;
    this.id = setInterval(() => {
      logUpdate(this.schema.frames[i = ++i % this.schema.frames.length] + ' ' + text);
    }, this.schema.interval);
  }

  public stop () {
    if (this.id !== undefined) {
      clearInterval(this.id);
    }
  }

  public static async while <T> (promise: Promise<T>, text: string) {
    const spinner = new Spinner();
    spinner.start(text);
    const result = await promise;
    spinner.stop();
    return result;
  }

}