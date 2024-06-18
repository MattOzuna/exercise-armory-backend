const db = require("../db.js");
const { sqlForPartialUpdate } = require("../helpers/sql.js");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError.js");

class Workouts {
  /**
   * Create a new workout.
   * @param {Object} data - { userId, exercises, notes }
   * @returns {Object} - workout data
   */
  static async create({ username, exercises = [], notes = null }) {
    const date = new Date().toISOString().split("T")[0];
    const result = await db.query(
      `INSERT INTO workouts (user_id, date, exercises, notes)
           VALUES ($1, $2, $3, $4)
           RETURNING id, user_id AS "username", exercises, notes`,
      [username, date, exercises, notes]
    );
    const workout = result.rows[0];

    for (let exercise of exercises) {
      await db.query(
        `INSERT INTO workouts_exercises (workout_id, exercise_id)
               VALUES ($1, $2)`,
        [workout.id, exercise]
      );
    }

    return workout;
  }
}

module.exports = Workouts;
