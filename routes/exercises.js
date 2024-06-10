const express = require("express");
const router = new express.Router();
const Exercise = require("../models/exercises");

//==========================================================================//

// GET /exercises
// GET /exercises?name=exerciseName
// GET /exercises?bodyPart=exerciseCategory
// GET /exercises?bodyPart=exerciseCategory&name=exerciseName
router.get("/", async function (req, res, next) {
  try {
    if(Object.keys(req.query).length === 0){
      const exercises = await Exercise.findAll();
      return res.json({ exercises });
    } else {
      const exercises = await Exercise.search(req.query);
      return res.json({ exercises });
    }
  } catch (err) {
    return next(err);
  }
});

//==========================================================================//

// GET /exercises/:id
router.get("/:id", async function (req, res, next) {
  try {
    const exercise = await Exercise.findById(req.params.id);
    return res.json({ exercise });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
