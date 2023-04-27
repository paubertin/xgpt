import { exec } from "child_process";

let CallInstallOnce = false;
let InstallModelOnce = false;
const Install = async (pip = "pip", python = "python") => {
  return new Promise<any>(async (resolve, reject) => {
    let IsExisted = false;
    const CheckIfPackagesInstalled_call: any = await CheckIfPackagesInstalled();
    console.log('CheckIfPackagesInstalled_call', CheckIfPackagesInstalled_call);
    let pip;
    let python;
    if (CheckIfPackagesInstalled_call) {
      pip = CheckIfPackagesInstalled_call.pip;
      python = CheckIfPackagesInstalled_call.python;
    }
    if (pip || python) {
      IsExisted = await CheckIfPackagesInstalled(pip, python);
    }
    if (IsExisted) return resolve(true);
    //exec command to install SpaCy and show the output in console real time

    console.info("Installing Spacy");

    exec(
      `pip install -r ./src/spacy/requirements.txt`,
      async (err, stdout, stderr) => {
        if (err) {
          console.error(err);
          if (!CallInstallOnce) {
            CallInstallOnce = true;
            resolve({ pip: "pip3", python: "python3" });
          } else {
            reject(false);
          }
          return;
        }

        console.log(stdout);
        console.log(stderr);

        console.info("Installing en_core_web_sm");
        const Downloaden_core_web_sm_call: any = await Downloaden_core_web_sm();
        let pip;
        let python;
        if (Downloaden_core_web_sm_call) {
          pip = Downloaden_core_web_sm_call.pip;
          python = Downloaden_core_web_sm_call.python;

        }
        if (pip || python) {
          await Downloaden_core_web_sm(pip, python);
        }
        resolve(true);
      }
    );
  });
};

const Downloaden_core_web_sm = async (pip = "pip", python = "python3") => {
  return new Promise(async (resolve, reject) => {
    exec(
      `${python} -m spacy download en_core_web_sm`,
      async (err, stdout, stderr) => {
        if (err) {
          console.error(err);
          if (!InstallModelOnce) {
            InstallModelOnce = true;
            resolve({ pip: "pip3", python: "python3" });
          } else {
            reject(false);
          }
          return;
        }
        console.log(stdout);
        console.log(stderr);
        resolve(true);
      }
    );
  });
};

let CheckIfPackagesInstalledCalledOnce = false;
const CheckIfPackagesInstalled = async (pip = "pip", python = "python3") => {
  return new Promise<any>(async (resolve, reject) => {
    exec(`${pip} list`, async (err, stdout, stderr) => {
      if (err) {
        console.error(err);
        if (!CheckIfPackagesInstalledCalledOnce) {
          CheckIfPackagesInstalledCalledOnce = true;
          resolve({ pip: "pip3", python: "python3" });
        } else {
          reject(false);
        }
        return;
      }

      console.info("Spacy installed?", stdout.includes("spacy"));
      console.info(
        "en_core_web_sm installed?",
        stdout.includes("en-core-web-sm")
      );

      if (stdout.includes("spacy") && stdout.includes("en-core-web-sm"))
        return resolve(true);
      resolve(false);
    });
  });
};
export default Install;
