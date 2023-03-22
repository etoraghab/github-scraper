async function sleep(t) {
  return new Promise((r) => {
    setTimeout(() => {
      r();
    }, t);
  });
}

const cocoSsd = require("@tensorflow-models/coco-ssd");
const tf = require("@tensorflow/tfjs-node");
const fs = require("fs").promises;
const file = require("fs");

const http = require("https");
let counter = 0;
let limit = 80000;
let globalmodel;

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
            console.log("Download Completed: " + counter);
            console.log("pridicting");
            await fs.readFile(`./github/${counter}.jpg`).then(async (d) => {
              const imgTensor = await tf.node.decodeImage(new Uint8Array(d), 3);
              await globalmodel.detect(imgTensor).then(async (a) => {
                if (a[0]) {
                  if (a[0].class == "person") {
                    console.log(`${counter} is person`);
                    fs.rename(
                      `./github/${counter}.jpg`,
                      `./face/${counter}.jpg`
                    );
                  } else {
                    fs.rename(
                      `./github/${counter}.jpg`,
                      `./notface/${counter}.jpg`
                    );
                    console.log(`${counter} is ${a[0].class}`);
                  }
                } else {
                  fs.rename(
                    `./github/${counter}.jpg`,
                    `./notface/${counter}.jpg`
                  );
                  console.log(`${counter} is nothing`);
                }
              });
            });
            counter++;
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
      console.log(counter, "exists");
      r();
      counter++;
      if (counter >= limit) {
        process.exit(0);
      }
      getfile(counter);
    }
  });
}

cocoSsd.load().then((v) => {
  console.log("model loaded");
  globalmodel = v;
  getfile(counter);
});
