const express = require("express");

const placesControllers = require("../controllers/places-controllers");
const { getPlaceById, getPlaceByUserId, createPlace } = placesControllers;

const router = express.Router();

router.get("/:pid", getPlaceById);

router.get("/user/:uid", getPlaceByUserId);

router.post("/", createPlace);
module.exports = router;
