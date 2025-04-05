import express from "express";
import cors from "cors";
import dotenv from 'dotenv';
import { query } from "./db.js"; 

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

//middleware
app.use(cors())
app.use(express.json())


// basic route
app.get("/test", (req, res) => {
    res.send("Server is running");
});

 app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
