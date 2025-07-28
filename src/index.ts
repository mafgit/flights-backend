import express from "express";
import dotenv from "dotenv";
import { ZodError, flattenError, prettifyError } from "zod";
import cors from "cors";
import cookieParser from "cookie-parser";
import createHttpError, { HttpError } from "http-errors";
import { lookup } from "ip-location-api";

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
import AircraftsRouter from "./entities/aircrafts/aircrafts.routes";
import BookingsRouter from "./entities/bookings/bookings.routes";
import AirportsRouter from "./entities/airports/airports.routes";
import FlightsRouter from "./entities/flights/flights.routes";
import FlightFaresRouter from "./entities/flight_fares/flight_fares.routes";
import UsersRouter from "./entities/users/users.routes";
import SeatsRouter from "./entities/seats/seats.routes";
import PaymentsRouter from "./entities/payments/payments.routes";
import CartsRouter from "./entities/carts/carts.routes";
import { MyRequest } from "./entities/auth/auth.types";

const app = express();
// app.set("trust proxy", true);
app.enable("trust proxy");
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(
  async (req: MyRequest, res: express.Response, next: express.NextFunction) => {
    // console.log("req.ip", req.ip);
    // console.log(req.cookies);

    if (!req.cookies.city || req.cookies.city === "undefined") {
      // const geoRes = await fetch(`https://ipapi.co/${req.ip}/json/`);
      // const { country, country_name, city, timezone, currency } =
      //   await geoRes.json();

      /*
        {
        "ip": "...",
        "network": "...",
        "version": "IPv4",
        "city": "Hyderabad",
        "region": "Punjab",
        "region_code": "SD",
        "country": "PK",
        "country_name": "Pakistan",
        "country_code": "PK",
        "country_code_iso3": "PAK",
        "country_capital": "Islamabad",
        "country_tld": ".pk",
        "continent_code": "AS",
        "in_eu": false,
        "postal": "...",
        "latitude": ...,
        "longitude": ...,
        "timezone": "Asia/Karachi",
        "utc_offset": "+0500",
        "country_calling_code": "+92",
        "currency": "PKR",
        "currency_name": "Rupee",
        "languages": "ur-PK,en-PK,pa,sd,ps,brh",
        "country_area": ...,
        "country_population": 212215030,
        "asn": "...",
        "org": "..."
      } */

      // const data = await lookup(req.ip!);
      // if (data) {
      //   const { currency, country_name, city, country, timezone } = data;
      //   req.city = city;
      //   req.country = country;
      //   req.country_name = country_name;
      //   req.timezone = timezone;
      //   req.currency = currency[0];

      //   res.cookie("city", city);
      //   res.cookie("country", country);
      //   res.cookie("country_name", country_name);
      //   res.cookie("timezone", timezone);
      //   res.cookie("currency", currency[0]);
      // } else {
      //   return next(createHttpError(400, "Failed to get location"));
      // }

      req.city = "Karachi";
      req.country = "PK";
      req.country_name = "Pakistan";
      req.timezone = "Asia/Karachi";
      req.currency = "PKR";

      const options = {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      };

      res.cookie("city", "Karachi", options);
      res.cookie("country", "PK", options);
      res.cookie("country_name", "Pakistan", options);
      res.cookie("timezone", "Asia/Karachi", options);
      res.cookie("currency", "PKR", options);
    }

    next();
  }
);
app.use("/api/auth", AuthRouter);
app.use("/api/airlines", AirlinesRouter);
app.use("/api/aircrafts", AircraftsRouter);
app.use("/api/bookings", BookingsRouter);
app.use("/api/flight-fares", FlightFaresRouter);
app.use("/api/flights", FlightsRouter);
app.use("/api/airports", AirportsRouter);
app.use("/api/payments", PaymentsRouter);
app.use("/api/seats", SeatsRouter);
app.use("/api/users", UsersRouter);
app.use("/api/carts", CartsRouter);

// global error handler (it must be the last middleware)
// express has a rule: if a middleware has 4 parameters, it is considered an error handler
// when next function is called inside any route with a parameter, that parameter is expected to be an error
// when next(error) is called, express immediately shifts to the route handler, skipping other middlewares
app.use(
  (
    err: HttpError | ZodError,
    req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    if (err instanceof ZodError) {
      console.error(`ZodError on ${req.originalUrl}`, prettifyError(err));
      res.status(400).json({ success: false, error: flattenError(err) });
    } else {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error(
        `HttpError on '${req.originalUrl}' (${status}): ${message}`
      );
      res.status(status).json({ success: false, error: message });
    }
  }
);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.info(`Server running on http://localhost:${PORT}`);
});
