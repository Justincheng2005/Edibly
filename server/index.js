import express from "express";
import cors from "cors";
import dotenv from 'dotenv';
import { query } from "./db/db.js";
// import userRoutes from "./routes/userRoutes.js";
// import mealRoutes from "./routes/mealRoutes.js";
import diningRoutes from "./routes/diningRoutes.js";

dotenv.config();
const app = express();

//middleware
app.use(cors())
app.use(express.json())

// app.use('/users', userRoutes)
// app.use('/meals', mealRoutes)
app.use('/diningLocations', diningRoutes)

// basic route
app.get("/test", (req, res) => {
    res.send("Server is running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port 5000`);
});
