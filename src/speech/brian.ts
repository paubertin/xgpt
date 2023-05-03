import { VoiceEngine } from "./base.js";
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export class BrianSpeech extends VoiceEngine {

  public constructor() {
    super();
  }

  protected override _init(): void {
  }

  protected override async _speech(text: string): Promise<boolean> {
    const response = await fetch(`https://api.streamelements.com/kappa/v2/speech?voice=Brian&text=${text}`);
    if (response.status === 200) {
      const blob = await response.blob();
      const buffer = await blob.arrayBuffer();
      fs.createWriteStream('speech.mp3').write(Buffer.from(buffer));
      await execPromise('mpg123 ./speech.mp3', { windowsHide: true });
      await fs.promises.rm('./speech.mp3');
      return true;
    }
    else {
      console.error(`Request failed with status code ${response.status}`);
      return false;
    }
  }
  
}