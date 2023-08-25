require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.use(bodyParser.urlencoded({ extended: "false" }));
app.use(bodyParser.json());

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

app.post("/api/shorturl", function (req, res) {
  const dns = require("dns");
  const options = {
    all: true,
  };
  let formatedUrl = req.body.url.replace(/^https?:\/\//i, "");
  dns.lookup(formatedUrl, options, (err, addresses) => {
    if (err) {
      res.json({ error: "invalid url" });
    }
    const fs = require("fs");
    fs.readFile("counter.json", (err, data) => {
      if (err) {
        res.json({ error: "invalid url" });
      }
      let counter = JSON.parse(data);
      let urlToSave = {
        original_url: req.body.url,
        short_url: counter,
      };
      fs.readFile("urls.json", (err, data) => {
        if (err) {
          res.json({ error: "invalid url" });
        }
        let existingUrls = JSON.parse(data);
        existingUrls.push(urlToSave);
        fs.writeFileSync("urls.json", JSON.stringify(existingUrls));
        fs.writeFileSync("counter.json", JSON.stringify(counter + 1));
        res.json(urlToSave);
      });
    });
  });
});

app.get("/api/shorturl/:shorturl", function (req, res) {
  const fs = require("fs");
  fs.readFile("urls.json", (err, data) => {
    if (err) {
      res.json({ error: "invalid url" });
    }
    let existingUrls = JSON.parse(data);
    existingUrls.forEach((oneUrl) => {
      if (oneUrl.short_url == req.params.shorturl) {
        res.redirect(oneUrl.original_url);
      }
    });
    res.json({ error: "invalid url" });
  });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
