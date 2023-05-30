const { v4: uuidv4 } = require("uuid");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

const Place = require("../models/place");
const HttpError = require("../models/http-error");
const getCoordsByAddress = require("../util/location");

// let DUMMY_PLACES = [
//   {
//     id: "p1",
//     title: "Empire State Building",
//     description: "One of the most famous skyscrapers in the world",
//     imageUrl:
//       "https://upload.wikimedia.org/wikipedia/commons/1/10/Empire_State_Building_%28aerial_view%29.jpg",
//     address: "20 W 34th St., New York, NY 10001, United States",
//     location: {
//       lat: 40.7484405,
//       lng: -73.9878531,
//     },
//     creator: "u1",
//   },
//   {
//     id: "p2",
//     title: "Empire State Building",
//     description: "One of the most famous skyscrapers in the world",
//     imageUrl:
//       "https://upload.wikimedia.org/wikipedia/commons/1/10/Empire_State_Building_%28aerial_view%29.jpg",
//     address: "20 W 34th St., New York, NY 10001, United States",
//     location: {
//       lat: 40.7484405,
//       lng: -73.9878531,
//     },
//     creator: "u1",
//   },
// ];

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId);
    res.json({ place: place.toObject({ getters: true }) });
  } catch (error) {
    throw new HttpError(
      "Could not find a place for the provided place id ",
      500
    );
  }

  if (!place) {
    throw new HttpError(
      "Could not find a place for the provided place id ",
      404
    );
  }
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;
  let places;

  try {
    places = await Place.find({ creator: userId });
  } catch (err) {
    const error = new HttpError("Something went wrong, please try again.", 500);
    return next(error);
  }

  if (!places || places.length === 0) {
    return next(
      new HttpError("Could not find  places for the provided user id ", 404)
    );
  }
  res.json({
    places: places.map((place) => place.toObject({ getters: true })),
  });
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid input passed", 422));
  }

  const { title, description, address, creator, image } = req.body;

  let coordinates;
  try {
    coordinates = await getCoordsByAddress(address);
  } catch (error) {
    return next(error);
  }

  const createdPlace = new Place({
    title,
    description,
    address,
    location: coordinates,
    image,
    creator,
  });

  try {
    await createdPlace.save();
  } catch (err) {
    const error = new HttpError(
      "Creating place failed, please try again ",
      500
    );
    return next(error);
  }

  res.status(201).json({ place: createdPlace });
};

const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors);
    return next(new HttpError("Invalid input passed", 422));
  }

  const { title, description } = req.body;
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    return next(
      new HttpError("Could not update the place, please try again", 500)
    );
  }

  place.title = req.body.title;
  place.description = req.body.description;

  try {
    await place.save();
  } catch (err) {
    const error = new HttpError("Could not update the place", 500);
    return next(error);
  }

  res.status(200).json({ place: place.toObject({ getters: true }) });
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findByIdAndDelete(placeId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, please try again later",
      500
    );
    return next(error);
  }

  res.status(200).json({ message: "Place deleted." });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
