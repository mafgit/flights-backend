import { NextFunction, Response } from "express";
import { MyRequest } from "../../entities/auth/auth.types";

export async function geoDataHandler(
  req: MyRequest,
  res: Response,
  next: NextFunction
) {
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
