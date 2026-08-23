import dotenv from "dotenv";
dotenv.config();


import connectDB from "./config/db.config.js"
import app from "./app.js"



const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer();