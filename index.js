var term = require("terminal-kit").terminal;
const pack = require("./package.json");
const cocoSsd = require("@tensorflow-models/coco-ssd");
const tf = require("@tensorflow/tfjs-node");
const fs = require("fs").promises;
const file = require("fs");

const http = require("https");
let counter = 0;
let limit;
let globalmodel;

async function sleep(t) {
  return new Promise((r) => {
    setTimeout(() => {
      r();
    }, t);
  });
}

async function getfile(counter) {
  return new Promise(async (r) => {
    if (
      !file.existsSync("./github/" + counter + ".jpg") &&
      !file.existsSync("./face/" + counter + ".jpg") &&
      !file.existsSync("./notface/" + counter + ".jpg")
    ) {
      // await sleep(1000);
      const filee = file.createWriteStream("./github/" + counter + ".jpg");
      const request = await http
        .get(`https://avatars.githubusercontent.com/u/${counter}`, function (
          response
        ) {
          response.pipe(filee);

          // after download completed close filestream
          filee.on("finish", async () => {
            filee.close();
            await fs.readFile(`./github/${counter}.jpg`).then(async (d) => {
              const imgTensor = await tf.node.decodeImage(new Uint8Array(d), 3);
              await globalmodel.detect(imgTensor).then(async (a) => {
                if (a[0]) {
                  if (a[0].class == "person") {
                    fs.rename(
                      `./github/${counter}.jpg`,
                      `./face/${counter}.jpg`
                    );
                  } else {
                    fs.rename(
                      `./github/${counter}.jpg`,
                      `./notface/${counter}.jpg`
                    );
                  }
                } else {
                  fs.rename(
                    `./github/${counter}.jpg`,
                    `./notface/${counter}.jpg`
                  );
                }
              });
            });
            counter++;
            progressBar.update(counter / limit);
            if (counter / limit >= 1) {
              intro(true);
              term.green("ALL FILES DOWNLOADED AND PARSED! CHECK FOLDERS!\n");
              process.exit(0);
            }
            if (counter >= limit) {
              process.exit(0);
            }
            r();
            getfile(counter);
          });
        })
        .on("error", (e) => {
          console.log(e);
        });
    } else {
      r();
      counter++;
      if (counter >= limit) {
        intro(true);
        term.yellow("ALREADY DOWNLOADED THESE MUCH FILES\n");
        process.exit(0);
      }
      getfile(counter);
    }
  });
}

cocoSsd.load().then(async (v) => {
  await term("enter an image processing limit (1000): ");
  term.inputField({}, (e, input) => {
    term.green("\nlimit set to %s\n", input);
    console.clear();
    limit = input || 1000;
    globalmodel = v;
    intro();
    getfile(counter);
  });
});

async function intro(without) {
  if (without) {
    console.clear();
  }
  console.log("╔═╗┬┌┬┐┬ ┬┬ ┬┌┐   ╔═╗┌─┐┬─┐┌─┐┌─┐┌─┐┬─┐");
  console.log("║ ╦│ │ ├─┤│ │├┴┐  ╚═╗│  ├┬┘├─┤├─┘├┤ ├┬┘");
  console.log("╚═╝┴ ┴ ┴ ┴└─┘└─┘  ╚═╝└─┘┴└─┴ ┴┴  └─┘┴└─");
  console.log("v" + pack.version);
  console.log("press ctrl+c to exit");
  if (!without) {
    progressBar = term.progressBar({
      width: 80,
      title: "progress: ",
      eta: false,
      percent: true,
    });
    console.log();
    term.spinner({
      animation: "asciiSpinner",
    });
  } else {
    await file.readdir("./face", async (e, f) => {
      if (e) {
        term.red("run setup");
        process.exit(0);
      }
      await file.readdir("./notface", (e, ff) => {
        if (e) {
          term.red("run setup");
          process.exit(0);
        }
        counter = f.length + ff.length;
        console.log("estimate of pre-progress: ", counter);
      });
    });
  }
}

intro(true);

/**
 * safety now
 */

const r = require("readline");
r.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
}
process.stdin.on("keypress", (s, k) => {
  if (k.ctrl == true && k.name == "c") {
    term.red("\nctrl+c pressed, now exitting\n");
    process.exit(0);
  }
});
