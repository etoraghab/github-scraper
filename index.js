const term = require("terminal-kit").terminal;
const pack = require("./package.json");
const cocoSsd = require("@tensorflow-models/coco-ssd");
const tf = require("@tensorflow/tfjs-node");
const fs = require("fs");
const http = require("https");

/**
 * intro
 */
function intro() {
  console.log("╔═╗┬┌┬┐┬ ┬┬ ┬┌┐   ╔═╗┌─┐┬─┐┌─┐┌─┐┌─┐┬─┐");
  console.log("║ ╦│ │ ├─┤│ │├┴┐  ╚═╗│  ├┬┘├─┤├─┘├┤ ├┬┘");
  console.log("╚═╝┴ ┴ ┴ ┴└─┘└─┘  ╚═╝└─┘┴└─┴ ┴┴  └─┘┴└─");
  console.log("v" + pack.version);
  console.log("press ctrl+c to exit");
}
intro()

/**
 * ctrl+c protection
 */

const r = require("readline");
r.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
}
process.stdin.on("keypress", (s, k) => {
  if (k.ctrl == true && k.name == "c") {
    console.clear();
    term.red("\nctrl+c pressed, now exitting\n");
    process.exit(0);
  }
});

/**
 * sleep function
 */

async function sleep(t) {
  return new Promise((r) => {
    setTimeout(() => {
      r();
    }, t);
  });
}

/**
 * init variables
 */

let counter = 0;
let model;
let progressBar;

/**
 * functions
 */

async function download(c, l) {
  return new Promise(async (r) => {
    await sleep(100)
    if (
      fs.existsSync(`./github/${c}.jpg`) ||
      fs.existsSync(`./face/${c}.jpg`) ||
      fs.existsSync(`./notface/${c}.jpg`)
    ) {
        r();
    } else {
      let file = fs.createWriteStream(`./github/${c}.jpg`);
      await http.get(`https://avatars.githubusercontent.com/u/${c}`, function (
        response
      ) {
        response.pipe(file);
        file.on("finish", async () => {
          file.close();
          await fs.promises.readFile(`./github/${c}.jpg`).then(async (d) => {
            let img = await tf.node.decodeImage(new Uint8Array(d), 3);
            await model.detect(img).then((res) => {
              if (res[0] && res[0].class == "person") {
                fs.promises.rename(`./github/${c}.jpg`, `./face/${c}.jpg`);
              } else {
                fs.promises.rename(`./github/${c}.jpg`, `./notface/${c}.jpg`);
              }
              r();
            });
          });
        });
      });
    }
  });
}

async function main() {
  let limit = parseInt(process.argv[2] || 100);
  if (!process.argv[2]) {
    term.red('no limit given, taking 100 as a default\n')
    term.gray("provide limit like: npm run start [limit]\n")
  }
  intro()
  term.green(`downloading and parsing ${limit} images\n`);
  cocoSsd.load().then(async (v) => {
    model = v;
    progressBar = term.progressBar({
      width: 80,
      title: "progress: ",
      eta: true,
      percent: true,
    });
    while (counter <= limit) {
      await download(counter, limit);
      progressBar.update(counter / limit);
      counter++;
    }
    process.exit(0);
  });
}

//run the app
console.clear();
main();
