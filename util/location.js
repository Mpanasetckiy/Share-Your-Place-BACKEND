const axios = require("axios");
const HttpError = require("../models/http-error");

const API_KEY = process.env.GOOGLE_API_KEY;

const getCoordsByAddress = async (address) => {
  const encodedAddress = encodeURIComponent(address);
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${API_KEY}`;

  try {
    const response = await axios.get(url);
    const data = response.data;

    if (!data || data.status === "ZERO_RESULTS") {
      const error = new HttpError(
        "Could not find location for the specified address",
        422
      );
      throw error;
    }

    const results = data.results;
    const firstResult = results[0];
    const geometry = firstResult.geometry;

    if (!geometry || !geometry.location) {
      const error = new HttpError("Invalid response from Geocoding API", 500);
      throw error;
    }

    const coordinates = geometry.location;
    return coordinates;
  } catch (error) {
    throw new HttpError("Failed to fetch coordinates", 500);
  }
};

module.exports = getCoordsByAddress;
