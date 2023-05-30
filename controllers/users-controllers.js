const HttpError = require("../models/http-error");
const { v4: uuidv4 } = require("uuid");
const { validationResult } = require("express-validator");

const USERS = [
  {
    id: "u1",
    name: "Maksim Lukianenko",
    email: "test@test.ru",
    password: "tester",
  },
  {
    id: "u2",
    name: "Dany Wilson",
    image: "https://images.pexels.com/photos/839011/pexels-photo-839011.jpeg",
    places: 1,
  },
  {
    id: "u3",
    name: "Eleonor Wix",
    image: "https://images.pexels.com/photos/839011/pexels-photo-839011.jpeg",
    places: 5,
  },
];

const getUserById = (req, res, next) => {
  //   const userId = req.params.uid;
  //   const user = USERS.find(({ id }) => id === userId);

  //   if (!user) {
  //     return next(new HttpError("User was not found."));
  //   }
  res.status(200).json({ USERS });
};

const signup = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors);
    return next(new HttpError("Invalid input passed", 422));
  }

  const { name, email, password } = req.body;

  const hasUser = USERS.find((u) => u.email === email);

  if (hasUser) {
    return next(
      new HttpError("Could not create a user, email already exists", 422)
    );
  }

  const createdUser = {
    id: uuidv4(),
    name,
    email,
    password,
  };

  USERS.push(createdUser);

  res.status(201).json({ user: createdUser });
};

const login = (req, res, next) => {
  const { email, password } = req.body;
  const identifiedUser = USERS.find((user) => user.email === email);

  if (!identifiedUser || identifiedUser.password !== password) {
    return next(new HttpError("User's not found", 401));
  }

  res.json({ message: "Logged in" });
};

exports.getUserById = getUserById;
exports.signup = signup;
exports.login = login;
