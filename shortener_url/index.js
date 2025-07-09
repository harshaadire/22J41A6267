import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import { fileURLToPath } from "url";
import path from "path";
import pg from "pg";
import shortid from "shortid";

const app = express();
const port = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public")); // this can kept by frontend developers

const db = new pg.Client({
  user:"postgres",
  host:"localhost",
  database:"url_table",
  password:"password",
  port:5432,
});
db.connect();

//after creating index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

//this is for post request
app.post("/shorten", async (req, res) => {
  const originalUrl = req.body.originalUrl;
  let shortId = shortid.generate();
  shortId = shortId.slice(0,6);

  try {
    await db.query(
      "INSERT INTO urls (short_id, original_url) VALUES ($1, $2)",
      [shortId, originalUrl]
    );
    res.send(`Short URL: <a href="/${shortId}" target="_blank">http://localhost:${port}/${shortId}</a>`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating short URL.");
  }
});

//after creating the short url we add it to get request so that when we call that we can redirect to orginal page this is done by using postgresql
app.get("/:shortId", async (req, res) => {
  const { shortId } = req.params;

  try {
    const result = await db.query(
      "SELECT original_url FROM urls WHERE short_id = $1",
      [shortId]
    );

    if (result.rows.length > 0) {
      res.redirect(result.rows[0].original_url);
    } else {
      res.status(404).send("Short URL not found.");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving URL.");
  }
});



app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
  });