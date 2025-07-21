import express from "express";
import dotenv from "dotenv";
import { ZodError } from "zod";
import cors from "cors";
import cookieParser from "cookie-parser";

const environment = process.env.NODE_ENV || "development";
if (environment !== "production") {
  // no need for dotenv config loading when in production
  dotenv.config({ quiet: true }); // loads base .env
  dotenv.config({ path: `.env.${environment}`, quiet: true }); // loads more env variables specific to environment
  // environment maybe development or test
}

import "./database/db";

import AuthRouter from "./entities/auth/auth.routes";
import AirlinesRouter from "./entities/airlines/airlines.routes";

const app = express();
app.set('trust proxy', true)
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use("/api/auth", AuthRouter);
app.use("/api/airlines", AirlinesRouter);

// global error handler (it must be the last middleware)
// express has a rule: if a middleware has 4 parameters, it is considered an error handler
// when next function is called inside any route with a parameter, that parameter is expected to be an error
// when next(error) is called, express immediately shifts to the route handler, skipping other middlewares
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.log(err);
    if (err instanceof ZodError) {
      res.status(400).json({ success: false, error: err.issues });
    }
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ success: false, error: message });
  }
);

// {
//   Response: {
//     status: "success" | "failed",
//     responseCode:  "200" | "201" | "400" | "401" | "403" | "404" | "500";
//     message: "Success message"
//   }
// }

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
