import express from "express";
import cors from "cors";
import dotenv from 'dotenv';
import supabase from './db/supabaseClient.js';
import mealRoutes from "./routes/mealRoutes.js";
import diningRoutes from "./routes/diningRoutes.js";
import preferencesRoutes from "./routes/preferencesRoutes.js";
import allergiesRoutes from "./routes/allergiesRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { Router } from "express";

const PORT = process.env.PORT || 5000;
dotenv.config();
const app = express();

const router = Router();
router.get('/connection-test', (req, res) => {
    res.json({
        status: 'ok',
        backend: 'running',
        timestamp: new Date().toISOString()
    });
});
//middleware
app.use(cors())
app.use(express.json())

app.use('/users', userRoutes)
app.use('/meals', mealRoutes)
app.use('/diningLocations', diningRoutes)
app.use('/profile', preferencesRoutes);
app.use('/profilee', allergiesRoutes);

// basic route
app.get("/test", (req, res) => {
    res.send("Server is running");
});

//test supabaseClient connection
const { data, error } = await supabase.from('meals').select('*');
console.log(data, error);

supabase.from('meals').select('*')
    .then(({ data, error }) => {
        console.log('Supabase connection test:', data, error);
    });

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
