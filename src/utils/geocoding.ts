import axios from "axios";

const OPENCAGE_URL = "https://api.opencagedata.com/geocode/v1/json";
const API_KEY = process.env.OPENCAGE_API_KEY!;

export async function geocodeAddress(address: string) {
  const res = await axios.get(OPENCAGE_URL, {
    params: {
      q: address,
      key: API_KEY,
      limit: 1,
      countrycode: "id",
    },
  });

  if (!res.data.results.length) {
    throw new Error("Alamat tidak ditemukan");
  }

  const geo = res.data.results[0].geometry;
  return {
    latitude: geo.lat,
    longitude: geo.lng,
  };
}
