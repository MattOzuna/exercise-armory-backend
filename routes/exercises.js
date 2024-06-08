const express = require("express");
const router = new express.Router();

router.get("/", async function (req, res, next) {
  try {
    const exercises = {
      exercises:
        "running, swimming, cycling, weightlifting, and high-intensity interval training (HIIT)",
    };
    return res.json({ exercises });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;