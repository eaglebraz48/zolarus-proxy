
// Serverless function: POST /.netlify/functions/search
// Body: { keywords, minPrice, maxPrice, likes, dislikes, deadlineDays }
const aws4 = require("aws4");
const fetch = require("node-fetch");

const HOST = "webservices.amazon.com";
const REGION = process.env.AMAZON_REGION || "us-east-1";
const PARTNER_TAG = process.env.AMAZON_PARTNER_TAG; 

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: cors(),
    };
  }

  try {
    const {
      keywords = "",
      minPrice, // in USD (e.g., 25) — PA-API expects cents
      maxPrice, // in USD
      likes = [],
      dislikes = [],
      deadlineDays
    } = JSON.parse(event.body || "{}");

    const bodyObj = {
      PartnerTag: PARTNER_TAG,
      PartnerType: "Associates",
      Marketplace: "www.amazon.com",
      Keywords: keywordsFrom(likes, keywords),
      MinPrice: toCents(minPrice),
      MaxPrice: toCents(maxPrice),
      Resources: [
        "Images.Primary.Large",
        "ItemInfo.Title",
        "ItemInfo.Features",
        "Offers.Listings.Price",
        "Offers.Listings.DeliveryInfo.IsPrimeEligible",
        "CustomerReviews.Count",
        "CustomerReviews.StarRating"
      ]
    };

    const body = JSON.stringify(bodyObj);

    const opts = {
      host: HOST,
      path: "/paapi5/searchitems",
      service: "ProductAdvertisingAPI",
      region: REGION,
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/json; charset=UTF-8"
      }
    };

    aws4.sign(opts, {
      accessKeyId: process.env.AMAZON_ACCESS_KEY_ID,
      secretAccessKey: process.env.AMAZON_SECRET_KEY
    });

    const resp = await fetch(`https://${HOST}${opts.path}`, {
      method: "POST",
      headers: opts.headers,
      body
    });

    const json = await resp.json();

    const items = (json.SearchResult && json.SearchResult.Items) || [];
    const results = items
      .map(normalizeItem)
      .filter(ok => !conflictsWithDislikes(ok, dislikes))
      .map(markDelivery(deadlineDays))
      .slice(0, 10);

    return {
      statusCode: 200,
      headers: { ...cors(), "Content-Type": "application/json" },
      body: JSON.stringify({ results })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: cors(),
      body: JSON.stringify({ error: err.message || "Internal error" })
    };
  }
};

// ---------- helpers ----------
const toCents = (v) => (typeof v === "number" ? Math.round(v * 100) : undefined);

const keywordsFrom = (likes, base) => {
  const l = Array.isArray(likes) ? likes.join(" ") : "";
  return [base, l].filter(Boolean).join(" ");
};

const normalizeItem = (it) => {
  const asin = it.ASIN;
  const priceObj = it.Offers?.Listings?.[0]?.Price;
  let priceNum;
  if (priceObj?.Amount != null) {
    priceNum = Number(priceObj.Amount);
  } else if (priceObj?.DisplayAmount) {
    const m = String(priceObj.DisplayAmount).match(/[\d.]+/g);
    priceNum = m ? Number(m.join("")) : undefined;
  }

  const image =
    it.Images?.Primary?.Large?.URL ||
    it.Images?.Primary?.Medium?.URL ||
    it.Images?.Primary?.Small?.URL;

  const rating = Number(it.CustomerReviews?.StarRating || 0);
  const reviews = Number(it.CustomerReviews?.Count || 0);

  return {
    id: asin,
    title: it.ItemInfo?.Title?.DisplayValue || "Untitled",
    price: priceNum,
    currency: priceObj?.Currency || "USD",
    image,
    url: `https://www.amazon.com/dp/${asin}/?tag=${PARTNER_TAG}`,
    tags: (it.ItemInfo?.Features?.DisplayValues || []).map(s => s.toLowerCase()),
    primeEligible: !!it.Offers?.Listings?.[0]?.DeliveryInfo?.IsPrimeEligible,
    rating,
    reviews
  };
};

const conflictsWithDislikes = (item, dislikes) => {
  const d = (dislikes || []).map(s => String(s).toLowerCase());
  if (!d.length) return false;
  const text = (item.title + " " + (item.tags || []).join(" ")).toLowerCase();
  return d.some(word => text.includes(word));
};

const markDelivery = (deadlineDays) => (item) => {
  if (!deadlineDays) return { ...item, ship_speed: "unknown" };
  // crude first pass: assume Prime can make <=3 days
  const speed = item.primeEligible && deadlineDays <= 3 ? "fast" : "standard";
  return { ...item, ship_speed: speed };
};

const cors = () => ({
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
});
