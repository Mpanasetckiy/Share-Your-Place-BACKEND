const express = require("express");
const { check } = require("express-validator");

const usersControllers = require("../controllers/users-controllers");
const { getUserById, signup, login } = usersControllers;

const router = express.Router();

router.get("/", getUserById);

router.post(
  "/signup",
  [
    check("name").not().isEmpty(),
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 6 }),
  ],
  signup
);

router.post("/login", login);

module.exports = router;
