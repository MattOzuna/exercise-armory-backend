const express = require("express");
const jsonschema = require("jsonschema");
const Exercise = require("../models/exercises");
const exerciseNewSchema = require("../schemas/exerciseNew.json");
const exerciseUpdateSchema = require("../schemas/exerciseUpdate.json");
const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureAdmin } = require("../middleware/auth");

const router = new express.Router();

//==========================================================================//

// GET /exercises
// GET /exercises?name=exerciseName
// GET /exercises?bodyPart=exerciseCategory
// GET /exercises?bodyPart=exerciseCategory&name=exerciseName
//
// => { exercises: [ { id, name, bodyPart, equipment, gifUrl, target, secondaryMuscles, instructions }, ...] }
router.get("/", ensureLoggedIn, async function (req, res, next) {
  try {
    if (Object.keys(req.query).length === 0) {
      const exercises = await Exercise.findAll();
      return res.json({ exercises });
    } else {
      const exercises = await Exercise.findAll(req.query);
      return res.json({ exercises });
    }
  } catch (err) {
    return next(err);
  }
});

//==========================================================================//

// GET /exercises/:id => { exercise }
router.get("/:id", ensureLoggedIn, async function (req, res, next) {
  try {
    const exercise = await Exercise.findById(req.params.id);
    return res.json({ exercise });
  } catch (err) {
    return next(err);
  }
});

//==========================================================================//

// POST /exercises => { exercise }
router.post("/", ensureLoggedIn, ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, exerciseNewSchema);
    if (!validator.valid) {
      const errors = validator.errors.map((error) => error.stack);
      throw new BadRequestError(errors);
    }

    const exercise = await Exercise.create(req.body);
    return res.status(201).json({ exercise });
  } catch (err) {
    return next(err);
  }
});

//==========================================================================//

router.patch(
  "/:id",
  ensureLoggedIn,
  ensureAdmin,
  async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, exerciseUpdateSchema);
      if (!validator.valid) {
        const errors = validator.errors.map((error) => error.stack);
        throw new BadRequestError(errors);
      }

      const exercise = await Exercise.update(req.params.id, req.body);
      return res.json({ exercise });
    } catch (err) {
      return next(err);
    }
  }
);

//==========================================================================//

// Delete /exercises/:id => { deleted: id }
router.delete(
  "/:id",
  ensureLoggedIn,
  ensureAdmin,
  async function (req, res, next) {
    try {
      await Exercise.delete(req.params.id);
      return res.json({ deleted: req.params.id });
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;
