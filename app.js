const express = require("express");
const nodemailer = require("nodemailer");
const multer = require("multer");
const bodyParser = require("body-parser");
const { google } = require("googleapis");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  next();
});

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, "public")));

// Route to serve the index.html file
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html")); // Ensure the path matches your file location
});

// Multer configuration for file uploads
const upload = multer({ dest: "uploads/" });

// OAuth2 setup for Google
const CLIENT_ID =
  "195713014656-5uprqg27vp5hmka2v3shht00ver91tb1.apps.googleusercontent.com";
const CLIENT_SECRET = "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";
const REDIRECT_URI = "https://developers.google.com/oauthplayground";
const REFRESH_TOKEN =
  "1//04q4WDD028kNMCgYIARAAGAQSNwF-L9IrWY689NTL4yLmeR0fJTmriADCchcTSqJxIxFvqfdfmm_py-dpYhcodfrD0WMifmNJWbg"; // Get this from OAuth playground or your app

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

async function sendMail(
  senderEmail,
  receiverEmail,
  image1,
  image2,
  description1,
  description2
) {
  try {
    // Set up Nodemailer transporter with app-generated password
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: senderEmail, // Your Gmail address
        pass: "uznf ikyj qkxh ikxp", // App-generated password
      },
    });

    // Define mail options
    const mailOptions = {
      from: senderEmail,
      to: receiverEmail,
      subject: "Images with Description",
      text: `Here are the descriptions of the images:\n1. ${description1}\n2. ${description2}`,
      attachments: [
        { filename: image1.originalname, path: image1.path },
        { filename: image2.originalname, path: image2.path },
      ],
    };

    // Send email
    const result = await transporter.sendMail(mailOptions);
    return result;
  } catch (error) {
    throw error;
  }
}

// Email sending route
app.post(
  "/send-email",
  upload.fields([{ name: "image1" }, { name: "image2" }]),
  async (req, res) => {
    const { senderEmail, receiverEmail, description1, description2 } = req.body;
    const image1 = req.files["image1"][0];
    const image2 = req.files["image2"][0];

    try {
      const emailResponse = await sendMail(
        senderEmail,
        receiverEmail,
        image1,
        image2,
        description1,
        description2
      );

      // Clean up the uploaded files
      fs.unlink(image1.path, () => {});
      fs.unlink(image2.path, () => {});

      res.send("Email sent successfully!");
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).send("Error sending email");
    }
  }
);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
