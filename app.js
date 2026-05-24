//imports
const express = require("express");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const path = require("path");
require("dotenv").config();

const upload = multer({ storage: multer.memoryStorage() });

//setting up the server using express
const app = express();
const port = process.env.PORT || 2000;

if (process.env.NODE_ENV !== "production") {
  app.listen(port, () => {
    console.log(`listening on port ${port}`);
  });
}

//cloudinary setup
cloudinary.config({
  cloud_name: "dqccntlcw",
  secure: true,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function uploadToCloudinary(fileBuffer, caption) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "voidcast",
        resource_type: "auto",
        context: {
          caption: caption || "Untitled cast",
        },
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      },
    );

    stream.end(fileBuffer);
  });
}

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
  res.render("add", { title: "New cast" });
});

app.post("/", upload.single("uploadedFile"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("Please choose a file to upload.");
    }

    await uploadToCloudinary(req.file.buffer, req.body.caption);

    res.redirect("/");
  } catch (error) {
    console.error(error);
    res.status(500).send("Upload failed. Please try again.");
  }
});

module.exports = app;
