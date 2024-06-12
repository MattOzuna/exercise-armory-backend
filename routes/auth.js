const express = require("express");
const jsonschema = require("jsonschema");

const User = require("../models/users");
const { createToken } = require("../helpers/tokens");
const { BadRequestError } = require("../expressError");
const userAuthSchema = require("../schemas/userAuth.json");
const userRegisterSchema = require("../schemas/userRegister.json");

const router = new express.Router();

//==============================================================================//

// POST /auth/login
// Returns JWT token on successful login
router.post("/login", async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userAuthSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const user = await User.authenticate(req.body);
    const token = createToken(user);
    return res.json({ token });
  } catch (err) {
    return next(err);
  }
});

//==============================================================================//

// POST /auth/register
// Returns JWT token on successful registration
router.post("/register", async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userRegisterSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const newUser = await User.register(req.body);
    const token = createToken(newUser);
    return res.json({ token });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
