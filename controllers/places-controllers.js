const fs = require("fs");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

const Place = require("../models/place");
const User = require("../models/user");

const { uploadToGCS } = require("../middleware/file-upload");

const HttpError = require("../models/http-error");
const getCoordsByAddress = require("../util/location");

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId);
    res.json({ place: place.toObject({ getters: true }) });
  } catch (err) {
    const error = new HttpError(
      "Could not find a place for the provided place id ",
      500
    );
    return next(error);
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

  let userWithPlaces;

  try {
    userWithPlaces = await User.findById(userId).populate("places");
  } catch (err) {
    const error = new HttpError("Something went wrong, please try again.", 500);
    return next(error);
  }

  if (!userWithPlaces || userWithPlaces.places.length === 0) {
    return next(
      new HttpError("Could not find  places for the provided user id ", 404)
    );
  }
  res.json({
    places: userWithPlaces.places.map((place) =>
      place.toObject({ getters: true })
    ),
  });
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid input passed", 422));
  }

  const { title, description, address } = req.body;

  let coordinates;

  try {
    coordinates = await getCoordsByAddress(address);
  } catch (error) {
    return next(error);
  }

  let imageUrl = null;
  if (req.file) {
    try {
      imageUrl = await uploadToGCS(req.file);
      console.log("url", imageUrl);
    } catch (err) {
      return next(new HttpError("Image upload failed, please try again.", 500));
    }
  }

  const createdPlace = new Place({
    title,
    description,
    address,
    location: coordinates,
    image: imageUrl,
    creator: req.userData.userId,
  });

  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError(
      "Could not find a user for the provided ID, please try again ",
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError(
      "Could not find a user for the provided ID, please try again ",
      404
    );
    return next(error);
  }

  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    await createdPlace.save({ session: session });
    user.places.push(createdPlace);
    await user.save({ session: session });
    await session.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Creating place failed, please try again ",
      500
    );
    console.log(err);
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

  if (place.creator.toString() !== req.userData.userId) {
    return next(
      new HttpError("It's not allowed to edit this place, please login", 403)
    );
  }

  place.title = title;
  place.description = description;

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
    place = await Place.findById(placeId).populate("creator");
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, please try again later",
      500
    );
    return next(error);
  }

  if (!place) {
    const error = new HttpError(
      "Could not find a place for the provided ID",
      404
    );
    return next(error);
  }

  if (place.creator.id !== req.userData.userId) {
    return next(
      new HttpError("It's not allowed to delete this place, please login", 403)
    );
  }

  const imagePath = place.image;

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await place.deleteOne({ session: sess });
    place.creator.places.pull(place);
    await place.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Could not delete the place, try again later",
      500
    );
    console.log(err);
    return next(error);
  }

  fs.unlink(imagePath, (err) => {
    console.log(err);
  });

  res.status(200).json({ message: "Place deleted." });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
