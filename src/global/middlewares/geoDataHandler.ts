import { NextFunction, Response } from "express";
import { MyRequest } from "../../entities/auth/auth.types";

export async function geoDataHandler(
  req: MyRequest,
  res: Response,
  next: NextFunction
) {
  // console.log("!!! req.ip !!!", req.ip);
  // console.log(
  //   "!!! req.headers['x-forwarded-for'] !!!",
  //   req.headers["x-forwarded-for"]
  // );
  // console.log("!!! req.socket.remoteAddress !!!", req.socket.remoteAddress);

  // console.log("!!! req.cookies !!!", req.cookies);

  if (
    !req.cookies.city ||
    req.cookies.city === "undefined" ||
    req.cookies.city === "null"
  ) {
    let ip = req.ip;
    if (ip === "::1" || ip === "127.0.0.1") {
      ip = "8.8.8.8";
    }

    console.log(`Calling IPAPI`);
    const geoRes = await fetch(`https://ipapi.co/${ip}/json/`);
    const { country, country_name, city, timezone, currency } =
      await geoRes.json();

    // console.log("!!! IPAPI returned !!!", {
    //   country,
    //   country_name,
    //   city,
    //   timezone,
    //   currency,
    // });

    const options = {
      maxAge: 365 * 24 * 60 * 60 * 1000, // 365 days
    };

    res.cookie("city", city, options);
    res.cookie("country", country, options);
    res.cookie("country_name", country_name, options);
    res.cookie("timezone", timezone, options);
    res.cookie("currency", currency, options);

    req.city = city;
    req.country = country;
    req.country_name = country_name;
    req.timezone = timezone;
    req.currency = currency;

    console.log("Currency", currency);
  } else {
    req.city = req.cookies.city;
    req.country = req.cookies.country;
    req.country_name = req.cookies.country_name;
    req.timezone = req.cookies.timezone;
    req.currency = req.cookies.currency;
  }

  next();
}

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
