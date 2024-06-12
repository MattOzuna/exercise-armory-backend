const express = require("express");
const jsonschema = require("jsonschema");

const User = require("../models/users");
const { BadRequestError } = require("../expressError");
const {
  ensureAdmin,
  ensureLoggedIn,
  ensureAdminOrUser,
} = require("../middleware/auth");
const userNewSchema = require("../schemas/userNew.json");
const userUpdateSchema = require("../schemas/userUpdate.json");

const router = new express.Router();

//==============================================================================//

// GET /users
// Requires admin access
// Returns list of all users
// Returns { users: [ { username, firstName, lastName, email }, ...] }

router.get("/", ensureLoggedIn, ensureAdmin, async function (req, res, next) {
  try {
    const users = await User.findAll();
    return res.json({ users });
  } catch (err) {
    return next(err);
  }
});

//==============================================================================//

// GET /users/:username
// Returns a single user found by username
router.get(
  "/:username",
  ensureLoggedIn,
  ensureAdminOrUser,
  async function (req, res, next) {
    try {
      const user = await User.get(req.params.username);
      return res.json({ user });
    } catch (err) {
      return next(err);
    }
  }
);

//==============================================================================//

// POST /users
// Adds a new user (admin only)
// This is not a registration route, this is for admins to add new users
// Returns the newly created user
router.post("/", ensureLoggedIn, ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const newUser = await User.register(req.body);
    return res.status(201).json({ user: newUser });
  } catch (err) {
    return next(err);
  }
});

//==============================================================================//

//PATCH /users/:username
//Updates user information
//Returns {user: user}
router.patch(
  "/:username",
  ensureLoggedIn,
  ensureAdminOrUser,
  async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, userUpdateSchema);
      if (!validator.valid) {
        const errs = validator.errors.map((e) => e.stack);
        throw new BadRequestError(errs);
      }

      const user = await User.update(req.params.username, req.body);
      console.log(user);
      return res.json({ user });
    } catch (err) {
      return next(err);
    }
  }
);

//==============================================================================//

// DELETE /users/:username
// Deletes a user (admin only)
// Returns { deleted: username }
router.delete(
  "/:username",
  ensureLoggedIn,
  ensureAdmin,
  async function (req, res, next) {
    try {
      await User.remove(req.params.username);
      return res.json({ deleted: req.params.username });
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;
