import express from "express";
import cors from "cors";
import dotenv from 'dotenv';
import supabase from './db/supabaseClient.js';
// import userRoutes from "./routes/userRoutes.js";
// import mealRoutes from "./routes/mealRoutes.js";
import diningRoutes from "./routes/diningRoutes.js";
import preferencesRoutes from "./routes/preferencesRoutes.js";
import allergiesRoutes from "./routes/allergiesRoutes.js";


const PORT = process.env.PORT || 3000;
dotenv.config();
const app = express();

//middleware
app.use(cors())
app.use(express.json())

// app.use('/users', userRoutes)
// app.use('/meals', mealRoutes)
app.use('/diningLocations', diningRoutes)
app.use('/profile/usrid/preferences', preferencesRoutes)
app.use('/profile/usrid/allergies', allergiesRoutes)

// basic route
app.get("/test", (req, res) => {
    res.send("Server is running");
});

//test supabaseClient connection
const { data, error } = await supabase.from('meals').select('*');
console.log(data, error)




app.listen(PORT, () => {
    console.log(`Server running on port 5000`);
});
