const db = require("../db.js");
const { NotFoundError, BadRequestError } = require("../expressError.js");

class Workouts {
  //===========================================================================//

  /**
   * Create a new workout.
   * @param {Object} data - { userId, exercises, notes }
   * @returns {Object} - workout data
   */
  static async create({ username, exercises = [], notes = null }) {
    const exercisesCheck = await db.query(
      `SELECT id FROM exercises WHERE id = ANY ($1)`,
      [exercises]
    );
    if (exercisesCheck.rows.length !== exercises.length)
      throw new BadRequestError(`Exercise not found`);

    const userCheck = await db.query(
      `SELECT username
            FROM users
            WHERE username = $1`,
      [username]
    );
    const user = userCheck.rows[0];
    if (!user) throw new NotFoundError(`No user: ${username}`);

    const date = new Date().toISOString();
    const result = await db.query(
      `INSERT INTO workouts (user_id, date, exercises, notes)
           VALUES ($1, $2, $3, $4)
           RETURNING id, date, user_id AS "username", exercises, notes`,
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

  //===========================================================================//

  /**
   * Get all workouts for a user.
   * @param {String} username
   * @returns {Array} - array of workouts
   */
  static async getAll(username) {
    const userCheck = await db.query(
      `SELECT username
            FROM users
            WHERE username = $1`,
      [username]
    );
    const user = userCheck.rows[0];
    if (!user) throw new NotFoundError(`No user: ${username}`);

    const result = await db.query(
      `SELECT id, user_id AS "username", date, exercises, notes
           FROM workouts
           WHERE user_id = $1
           ORDER BY date DESC`,
      [username]
    );
    return result.rows;
  }

  //===========================================================================//

  /**
   * Get a workout by id.
   * @param {Number} id
   * @returns {Object} - workout data
   */
  static async get(id) {
    const result = await db.query(
      `SELECT id, 
              user_id AS "username", 
              date, 
              exercises, 
              notes
           FROM workouts 
           WHERE id = $1`,
      [id]
    );
    const workout = result.rows[0];

    if (!workout) throw new NotFoundError(`No workout: ${id}`);

    const exercises = await db.query(
      `
      SELECT exercises.id, 
              exercises.name, 
              exercises.body_part AS "bodyPart", 
              exercises.equipment, 
              exercises.gif_url AS "gifUrl", 
              exercises.target, 
              exercises.secondary_muscles AS "secondaryMuscles", 
              exercises.instructions,
              workouts_exercises.sets,
              workouts_exercises.reps,
              workouts_exercises.weight
          FROM workouts_exercises
          JOIN exercises 
          ON workouts_exercises.exercise_id = exercises.id
          WHERE workouts_exercises.workout_id = $1`,
      [workout.id]
    );

    workout.exercises = exercises.rows;

    return workout;
  }

  //===========================================================================//

  /**
   * Update a workout.
   * @param {Number} id - workout id
   * @param {Object} data - { exercises, notes }
   * @returns {Object} - updated workout data
   */
  static async update(id, { exercises, notes = null }) {
    const exercisesCheck = await db.query(
      `SELECT id FROM exercises WHERE id = ANY ($1)`,
      [exercises]
    );
    if (exercisesCheck.rows.length !== exercises.length)
      throw new BadRequestError(`Exercise not found`);

    const result = await db.query(
      `UPDATE workouts
           SET exercises = $1,
               notes = $2
           WHERE id = $3
           RETURNING id, user_id AS "username", date, exercises, notes`,
      [exercises, notes, id]
    );
    const workout = result.rows[0];

    if (!workout) throw new NotFoundError(`No workout: ${id}`);

    await db.query(`DELETE FROM workouts_exercises WHERE workout_id = $1`, [
      id,
    ]);

    for (let exercise of exercises) {
      await db.query(
        `INSERT INTO workouts_exercises (workout_id, exercise_id)
               VALUES ($1, $2)`,
        [workout.id, exercise]
      );
    }

    return workout;
  }

  //===========================================================================//
  /**
   * Update workout exercise details.
   * @param {Number} workoutId - workout id
   * @param {Array} exercisesArr - array of exercise details
   * @returns {Object} - updated workout data
   * Example of exercisesArr:
   * [
   *  { exerciseId: 1, weight: 100, reps: 10, sets: 3 },
   * { exerciseId: 2, weight: 50, reps: 12, sets: 4 }
   * ]
   */
  static async updateWorkoutExerciseDetails(workoutId, exercisesArr) {
    const WorkoutDetails = {
      workoutId,
      exercises: [],
    };

    for (let exercise of exercisesArr) {
      const { exerciseId, weight, reps, sets } = exercise;

      const result = await db.query(
        `UPDATE workouts_exercises
           SET weight = $1,
               reps = $2,
               sets = $3
           WHERE workout_id = $4
           AND exercise_id = $5
           RETURNING exercise_id AS "exerciseId", weight, reps, sets`,
        [weight, reps, sets, workoutId, exerciseId]
      );
      const exerciseDetails = result.rows[0];

      if (!exerciseDetails)
        throw new NotFoundError(
          `No workout: ${workoutId} or exercise: ${exerciseId}`
        );
      
      WorkoutDetails.exercises.push(exerciseDetails);
    }

    return WorkoutDetails;
  }

  //===========================================================================//

  /**
   * Delete a workout.
   * @param {Number} id - workout id
   */
  static async delete(id) {
    const result = await db.query(
      `DELETE
           FROM workouts
           WHERE id = $1
           RETURNING id`,
      [id]
    );
    const workout = result.rows[0];

    if (!workout) throw new NotFoundError(`No workout: ${id}`);
  }
}

module.exports = Workouts;
