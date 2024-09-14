const axios = require("axios");
const HttpError = require("../models/http-error");

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

const getCoordsByAddress = async (address) => {
  const encodedAddress = encodeURIComponent(address);
  const url = `${NOMINATIM_URL}?q=${encodedAddress}&format=json&addressdetails=1&limit=1`;

  try {
    const response = await axios.get(url);
    const data = response.data;

    if (!data || data.length === 0) {
      const error = new HttpError(
        "Could not find location for the specified address",
        422
      );
      throw error;
    }

    const firstResult = data[0];

    const coordinates = {
      lat: firstResult.lat,
      lng: firstResult.lon,
    };

    return coordinates;
  } catch (error) {
    throw new HttpError("Failed to fetch coordinates", 500);
  }
};

module.exports = getCoordsByAddress;
