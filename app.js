//imports
const express = require("express");
const cloudinary = require("cloudinary").v2;
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config();

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "dqccntlcw";

//setting up the server using express
const app = express();
const port = process.env.PORT || 2000;

if (process.env.NODE_ENV !== "production") {
  app.listen(port, () => {
    console.log(`listening on port ${port}`);
  });
}

//db connection
const dbURI =
  "mongodb+srv://fadikaizen:zxcvbnm123@auth-cluster.1nfzlys.mongodb.net/?appName=auth-cluster";

const connectDB = async () => {
  try {
    await mongoose.connect(dbURI);
    console.log("Connected to MongoDB successfully!");
  } catch (error) {
    console.error("Connection error:", error);
  }
};

//cloudinary setup
cloudinary.config({
  cloud_name: cloudName,
  secure: true,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function getCloudinaryCasts() {
  const resourceTypes = ["image", "raw", "video"];
  const responses = await Promise.all(
    resourceTypes.map((resourceType) =>
      cloudinary.api
        .resources({
          type: "upload",
          prefix: "voidcast/",
          resource_type: resourceType,
          context: true,
          max_results: 100,
        })
        .catch(() => ({ resources: [] })),
    ),
  );

  return responses
    .flatMap((response) => response.resources)
    .map((resource) => ({
      caption:
        resource.context?.custom?.caption ||
        resource.context?.caption ||
        resource.public_id.replace("voidcast/", ""),
      url: resource.secure_url,
      resourceType: resource.resource_type,
      format: resource.format,
      publicId: resource.public_id,
      createdAt: resource.created_at,
    }))
    .sort(
      (first, second) => new Date(second.createdAt) - new Date(first.createdAt),
    );
}

//register view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true }));

//page routes
app.get("/", async (req, res) => {
  try {
    const casts = await getCloudinaryCasts();
    res.render("index", { title: "home", casts });
  } catch (error) {
    console.error(error);
    res.status(500).send("Could not load uploads.");
  }
});

app.get("/Add-cast", (req, res) => {
  res.render("add", {
    title: "New cast",
    cloudName,
    cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
  });
});

app.post("/cloudinary-signature", (req, res) => {
  if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return res.status(500).json({ error: "Cloudinary is not configured." });
  }

  const timestamp = Math.round(Date.now() / 1000);
  const folder = "voidcast";
  const caption = (req.body.caption || "").trim();
  const context = caption ? `caption=${caption}` : undefined;
  const paramsToSign = {
    folder,
    timestamp,
  };

  if (context) {
    paramsToSign.context = context;
  }

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET,
  );

  res.json({
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName,
    context,
    folder,
    signature,
    timestamp,
  });
});

app.post("/", (req, res) => {
  res.status(410).send("Uploads must go directly to Cloudinary.");
});

module.exports = app;
