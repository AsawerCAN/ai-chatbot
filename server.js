import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
const PORT = process.env.PORT || 4005;
const uploads = multer({ dest: "uploads/" });

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is required");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));

app.post("/get", uploads.single("file"), async (req, res) => {
  const userInput = req.body.msg;
  const file = req.file;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    let prompt = [userInput];

    if (file) {
      const fileData = fs.readFileSync(file.path);
      const image = {
        inlineData: {
          data: fileData.toString("base64"),
          mimeType: file.mimetype,
        },
      };
      prompt.push(image);
    }

    const response = await model.generateContent(prompt);

    res.send(response.response.text());
  } catch (error) {
    console.error("Error generating response: ", error);
    res.status(500).send("An error occurred while generating the response");
  } finally {
    if (file) {
      fs.unlinkSync(file.path);
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
