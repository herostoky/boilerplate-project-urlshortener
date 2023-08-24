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

// INIT MONGOOSE MODELS
let mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const counterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
  },
  {
    collection: "Counter",
  }
);
let Counter = mongoose.model("Counter", counterSchema);
const urlSchema = new mongoose.Schema(
  {
    original_url: {
      type: String,
      required: true,
    },
    short_url: {
      type: Number,
    },
  },
  {
    collection: "Url",
  }
);
urlSchema.pre("save", function (next) {
  let doc = this;
  let query = { seq: { $gt: 0 } };
  let updateSet = { $inc: { seq: 1 } };
  let options = { new: true };
  Counter.findOneAndUpdate(query, updateSet, options)
    .then(function (updatedCounter) {
      doc.short_url = updatedCounter.seq;
      next();
    })
    .catch(function (err) {
      console.log(err);
    });
});
let Url = mongoose.model("Url", urlSchema);
// INIT MONGOOSE MODELS END

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
    let urlEntity = new Url({
      original_url: req.body.url,
    });
    urlEntity
      .save()
      .then(function (createdUrl) {
        res.json({
          original_url: createdUrl.original_url,
          short_url: createdUrl.short_url,
        });
      })
      .catch(function (err) {
        console.log(err);
      });
  });
});

app.get("/api/shorturl/:shorturl", function (req, res) {
  let query = { short_url: req.params.shorturl };
  Url.findOne(query)
    .then(function (foundUrl) {
      res.redirect(foundUrl.original_url);
    })
    .catch(function (err) {
      console.log(err);
    });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
