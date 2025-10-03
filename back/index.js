const express = require("express");
require("dotenv").config();   // 👈 load variables from .env first

const ConnectToMongo = require("./db");
ConnectToMongo();

const cors = require("cors");
const app = express();

app.use(express.json());
app.use(cors());

// use port from .env if available, fallback to 7000
const PORT = process.env.PORT || 7000;

app.use("/admin", require("./Routes/admin_routes"));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
