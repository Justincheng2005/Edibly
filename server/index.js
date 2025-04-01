const express = require("express");
const app = express();
const cors = require("cors")

//middleware
app.use(cors())
app.use(express.json())

//basic route
app.get("/", (req, res) => {
    res.send("Server is running");
});
  
app.listen(5000, () => {
    console.log(`Server running on port 5000`);
});
