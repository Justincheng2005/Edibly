const express = require("express");
const app = express();
const cors = require("cors")

//middleware
app.use(cors())
app.use(express.json())

const userRoutes = require('./routes/userRoutes')
const mealRoutes = require('./routes/mealRoutes')
const diningRoutes = require('./routes/diningRoutes')

app.use('/users', userRoutes)
app.use('/meals', mealRoutes)
app.use('/diningHalls', diningRoutes)

//basic route
app.get("/", (req, res) => {
    res.send("Server is running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port 5000`);
});
