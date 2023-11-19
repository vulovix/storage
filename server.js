require("dotenv").config();

const path = require("path");
const fse = require("fs-extra");
const express = require("express");
const cloudinary = require("cloudinary").v2;

const app = express();

app.use("/static", express.static(path.join(__dirname, "public")));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const cloudinaryConfig = cloudinary.config({
  cloud_name: process.env.CLOUDNAME,
  api_key: process.env.CLOUDAPIKEY,
  api_secret: process.env.CLOUDINARYSECRET,
  secure: true,
});

function passwordProtected(req, res, next) {
  res.set("WWW-Authenticate", "Basic realm='Files by Komplexica'");
  if (req.headers.authorization == `Basic ${btoa(process.env.CREDENTIALS)}`) {
    next();
  } else {
    res.status(401).send("Try again");
  }
}

app.use(passwordProtected);

app.get("/", (req, res) => {
  res.send(`<!DOCTYPE html>
              <html lang="en">
                <head>
                  <meta charset="UTF-8" />
                  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
                  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                  <title>Document</title>
                </head>
                <body>
                  <h1>Welcome</h1>

                  <form id="upload-form">
                    <input id="file-field" type="file" />
                    <button>Upload</button>
                  </form>

                  <hr />

                  <a href="/view-photos">How would I use the public_id values that I store in my database?</a>

                  <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
                  <script src="/static/client.js"></script>
                </body>
              </html>`);
});

app.get("/get-signature", (req, res) => {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp: timestamp,
    },
    cloudinaryConfig.api_secret
  );
  res.json({ timestamp, signature });
});

app.post("/save-photo", async (req, res) => {
  const expectedSignature = cloudinary.utils.api_sign_request(
    { public_id: req.body.public_id, version: req.body.version },
    cloudinaryConfig.api_secret
  );
  let status = 200;

  if (expectedSignature === req.body.signature) {
    await fse.ensureFile("./data.txt");
    const existingData = await fse.readFile("./data.txt", "utf8");
    await fse.outputFile(
      "./data.txt",
      existingData + req.body.public_id + "\n"
    );
  } else {
    status = 403;
  }

  res.sendStatus(status);
});

app.get("/data", async (req, res) => {
  await fse.ensureFile("./data.txt");
  const existingData = await fse.readFile("./data.txt", "utf8");
  res.send(existingData);
});

app.get("/view-photos", async (req, res) => {
  await fse.ensureFile("./data.txt");
  const existingData = await fse.readFile("./data.txt", "utf8");
  res.send(`<h1>Hello, here are a few photos...</h1>
            <ul>
            ${existingData
              .split("\n")
              .filter((item) => item)
              .map((id) => {
                return `<li><img src="https://res.cloudinary.com/${cloudinaryConfig.cloud_name}/image/upload/w_200,h_100,c_fill,q_100/${id}.jpg">
                <form action="delete-photo" method="POST">
                  <input type="hidden" name="id" value="${id}" />
                  <button>Delete</button>
                </form>
                </li>
                `;
              })
              .join("")}
            </ul>
            <p><a href="/">Back to homepage</a></p>
  `);
});

app.post("/delete-photo", async (req, res) => {
  await fse.ensureFile("./data.txt");
  const existingData = await fse.readFile("./data.txt", "utf8");
  await fse.outputFile(
    "./data.txt",
    existingData
      .split("\n")
      .filter((id) => id != req.body.id)
      .join("\n")
  );

  cloudinary.uploader.destroy(req.body.id);

  res.redirect("/view-photos");
});

app.listen(process.env.PORT, () =>
  console.log(`files.komplexica.com:${process.env.PORT}`)
);
