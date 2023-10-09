require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use(bodyParser.urlencoded({ extended: "false" }));
app.use(bodyParser.json());

const logger = require("./logger");
app.use(logger);

app.post("/api/shorturl", function (req, res) {
  const dns = require("dns");
  const options = {
    all: true,
  };
  let formatedUrl = req.body.url
    .replace(/^https?:\/\//i, "")
    .replace(/\/\?.*$/g, "");
  let isRead = false;
  let hasError = false;
  dns.lookup(formatedUrl, options, (err, addresses) => {
    if (!isRead) {
      if (err) {
        hasError = true;
        res.json({ error: "invalid url" });
        return;
      }
      const fs = require("fs");
      fs.readFile("counter.json", (err, data) => {
        if (err) {
          hasError = true;
          res.json({ error: "invalid url" });
          return;
        }
        let counter = JSON.parse(data);
        let urlToSave = {
          original_url: req.body.url,
          short_url: counter,
        };
        fs.readFile("urls.json", (err, data) => {
          if (err) {
            hasError = true;
            res.json({ error: "invalid url" });
            return;
          }
          let existingUrls = JSON.parse(data);
          existingUrls.push(urlToSave);
          fs.writeFileSync("urls.json", JSON.stringify(existingUrls));
          fs.writeFileSync("counter.json", JSON.stringify(counter + 1));
          if (!hasError) {
            res.json(urlToSave);
            return;
          }
        });
      });
    }
  });
});

app.get("/api/shorturl/:shorturl", function (req, res) {
  const fs = require("fs");
  let isRead = false;
  fs.readFile("urls.json", (err, data) => {
    let hasFound = false;
    if (!isRead) {
      isRead = true;
      if (err) {
        res.json({ error: "invalid url" });
        return;
      }
      let existingUrls = JSON.parse(data);
      existingUrls.forEach((oneUrl) => {
        if (oneUrl.short_url == req.params.shorturl) {
          hasFound = true;
          res.redirect(oneUrl.original_url);
          return;
        }
      });
      if (!hasFound) {
        res.json({ error: "invalid url" });
        return;
      }
    }
  });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
