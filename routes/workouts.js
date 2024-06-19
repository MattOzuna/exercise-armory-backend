const express = require("express");

const Workouts = require("../models/workouts");
const { BadRequestError } = require("../expressError");
const {
  ensureAdmin,
  ensureLoggedIn,
  ensureAdminOrUser,
} = require("../middleware/auth");

const router = new express.Router();

//==============================================================================//

//GET / - get all workouts
//ADMIN ONLY ROUTE
//Use user get route to get all workouts for a user
//Returns { workouts: [{ id, username, date, exercises, notes }, ...] }

router.get("/", ensureLoggedIn, ensureAdmin, async function (req, res, next) {
  try {
    const workouts = await Workouts.getAll(req.body.username);
    return res.json({ workouts });
  } catch (err) {
    return next(err);
  }
});

//==============================================================================//


//==============================================================================//

module.exports = router;
