const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const { NotFoundError } = require("./expressError");
const { authenticateJWT } = require("./middleware/auth");

const exercisesRouter = require("./routes/exercises");
const authRouter = require("./routes/auth");
const usersRouter = require("./routes/users");
const workoutsRouter = require("./routes/workouts");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("tiny"));
app.use(authenticateJWT);

app.use("/exercises", exercisesRouter);
app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/workouts", workoutsRouter);

/** Handle 404 errors -- this matches everything */
app.use(function (req, res, next) {
  return next(new NotFoundError());
});

/** Generic error handler; anything unhandled goes here. */
app.use(function (err, req, res, next) {
  if (process.env.NODE_ENV !== "test") console.error(err.stack);
  const status = err.status || 500;
  const message = err.message;

  return res.status(status).json({
    error: { message, status },
  });
});

module.exports = app;
