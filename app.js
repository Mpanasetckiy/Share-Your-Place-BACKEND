const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const placesRoutes = require("./routes/places-routes");
const usersRoutes = require("./routes/users-routes");
const HttpError = require("./models/http-error");
const url =
  "mongodb+srv://maxbuzz8694:2Ywzqfodq6jkfEQb@cluster0.2yibig1.mongodb.net/places?retryWrites=true&w=majority";

const app = express();

app.use(bodyParser.json());

app.use("/api/places", placesRoutes);

app.use("/api/users", usersRoutes);

app.use((req, res, next) => {
  const error = new HttpError("Could not find this route", 404);
  next(error);
});

app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occurred" });
});

mongoose
  .connect(url)
  .then(() => {
    app.listen(5000);
    console.log("Connected to database");
  })
  .catch((err) => {
    console.log(err);
  });
