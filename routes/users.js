const express = require("express");
const jsonschema = require("jsonschema");

const User = require("../models/users");
const Workouts = require("../models/workouts");
const { BadRequestError } = require("../expressError");
const {
  ensureAdmin,
  ensureLoggedIn,
  ensureAdminOrUser,
} = require("../middleware/auth");
const userNewSchema = require("../schemas/userNew.json");
const userUpdateSchema = require("../schemas/userUpdate.json");
const workoutsNewSchema = require("../schemas/workoutsNew.json");
const workoutsUpdateSchema = require("../schemas/workoutsUpdate.json");

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
      const workouts = await Workouts.getAll(req.params.username);
      if (workouts.length > 0) {
        user.workouts = workouts;
      }
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

//==============================================================================//

// GET /users/:username/workouts/:id
// Returns a single workout found by id

router.get("/:username/workouts/:id", ensureLoggedIn, ensureAdminOrUser, async function (req, res, next) {
  try {
    const workout = await Workouts.get(req.params.id);
    return res.json({ workout });
  } catch (err) {
    return next(err);
  }
});

//==============================================================================//

// POST /users/:username/workouts
// Adds a new workout for a user
// Returns the newly created workout

router.post(
  "/:username/workouts",
  ensureLoggedIn,
  ensureAdminOrUser,
  async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, workoutsNewSchema);
      if (!validator.valid) {
        const errs = validator.errors.map((e) => e.stack);
        throw new BadRequestError(errs);
      }

      const data = { ...req.body, username: req.params.username };
      
      const workout = await Workouts.create(data);
      return res.status(201).json({ workout });
    } catch (err) {
      return next(err);
    }
  }
);

//==============================================================================//

// PATCH /users/:username/workouts/:id
// Updates a workout
// Returns { workout: workout }
router.patch(
  "/:username/workouts/:id",
  ensureLoggedIn,
  ensureAdminOrUser,
  async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, workoutsUpdateSchema);
      if (!validator.valid) {
        const errs = validator.errors.map((e) => e.stack);
        throw new BadRequestError(errs);
      }

      const workout = await Workouts.update(req.params.id, req.body);
      return res.json({ workout });
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;
