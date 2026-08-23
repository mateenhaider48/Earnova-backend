import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();

// ✅ CORS configuration
app.use(
  cors({
    origin: "http://localhost:3000", // frontend URL
    credentials: true, // allow cookies
  })
);

app.use(express.json());
app.use(cookieParser());
// ================= Routes ================
import authRoutes from "./routes/auth.routes"
app.use("/api/auth", authRoutes);

// ================= admin routes =============
import adminRoutes from "./routes/admin.routes"
app.use("/api/admin",adminRoutes)

//================== User routes ============
import userRoutes from "./routes/user.routes"
app.use("/api/user",userRoutes)

export default app;