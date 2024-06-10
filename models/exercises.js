const db = require("../db");
const { sqlForPartialUpdate } = require("../helpers/sql");
const { BadRequestError, NotFoundError } = require("../expressError");


class Exercises {
  //================================================================================================//
  /**
   * Create a new exercise
   * @param {Object} exerciseData
   * @param {String} exerciseData.name
   * @param {String} exerciseData.bodyPart
   * @param {String} exerciseData.equipment
   * @param {String} exerciseData.gifUrl
   * @param {String} exerciseData.target
   * @param {Array} exerciseData.secondaryMuscles
   * @param {Array} exerciseData.instructions
   * @returns {Object} exercise
   * @throws BadRequestError if exercise already exists
   * @throws BadRequestError if invalid body part
   */
  static async create({
    name,
    bodyPart,
    equipment,
    gifUrl,
    target,
    secondaryMuscles,
    instructions,
  }) {
    const duplicateCheck = await db.query(
      `SELECT name
             FROM exercises
             WHERE name = $1`,
      [name]
    );

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate exercise: ${name}`);

    const result = await db.query(
      `INSERT INTO exercises
         (name, body_part, equipment, gif_url, target, secondary_muscles, instructions)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, name, body_part, equipment, gif_url, target, secondary_muscles, instructions`,
      [
        name,
        bodyPart,
        equipment,
        gifUrl,
        target,
        secondaryMuscles,
        instructions,
      ]
    );
    const exercise = result.rows[0];
    return exercise;
  }

  //================================================================================================//
  /**
   * Find all exercises
   * @param {Object} searchFilters (optional)
   * @returns {Array} exercises
   *
   */
  static async findAll(searchFilters = {}) {
    let query = `SELECT id, name, body_part, equipment, gif_url, target, secondary_muscles, instructions
             FROM exercises`;
    const whereList = [];
    const queryValues = [];

    const { name, bodyPart } = searchFilters;

    if (name) {
      queryValues.push(`%${name}%`);
      whereList.push(`name ILIKE $${queryValues.length}`);
    } else if (bodyPart) {
      queryValues.push(bodyPart);
      whereList.push(`body_part = $${queryValues.length}`);
    }
    if (whereList.length > 0) {
      query += " WHERE " + whereList.join(" AND ") + " ORDER BY name";
    }

    const result = await db.query(query, queryValues);
    return result.rows;
  }

  //================================================================================================//
  /**
   * Find an exercise by id
   * @param {String} id
   * @returns {Object} exercise
   * @throws NotFoundError if no exercise found
   */
  static async findById(id) {
    const result = await db.query(
      `SELECT id, name, body_part, equipment, gif_url, target, secondary_muscles, instructions
             FROM exercises
             WHERE id = $1`,
      [id]
    );

    const exercise = result.rows[0];

    if (!exercise) throw new NotFoundError(`No exercise with id: ${id}`);

    return exercise;
  }

  //================================================================================================//

  /**
   * Update an exercise
   * @param {String} id
   * @param {Object} data
   * @param {String} data.name
   * @param {String} data.bodyPart
   * @param {String} data.equipment
   * @param {String} data.gifUrl
   * @param {String} data.target
   * @param {Array} data.secondaryMuscles
   * @param {Array} data.instructions
   * @returns {Object} exercise
   * @throws NotFoundError if no exercise found
   * @throws BadRequestError if no data provided
   * @throws BadRequestError if invalid data provided
   */
  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      bodyPart: "body_part",
      gifUrl: "gif_url",
      secondaryMuscles: "secondary_muscles",
    });
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE exercises
                      SET ${setCols}
                      WHERE id = ${idVarIdx}
                      RETURNING id,
                                name,
                                body_part AS "bodyPart",
                                equipment,
                                gif_url AS "gifUrl",
                                target,
                                secondary_muscles AS "secondaryMuscles",
                                instructions`;

    const result = await db.query(querySql, [...values, id]);
    const exercise = result.rows[0];

    if (!exercise) throw new NotFoundError(`No exercise with id: ${id}`);

    return exercise;
  }

  //================================================================================================//
  /**
   * Delete an exercise
   * @param {String} id
   * @returns {Object} exercise
   * @throws NotFoundError if no exercise found
   */
  static async delete(id) {
    const result = await db.query(
      `DELETE
             FROM exercises
             WHERE id = $1
             RETURNING id, name`,
      [id]
    );
    const exercise = result.rows[0];

    if (!exercise) throw new NotFoundError(`No exercise w/ ID: ${id}`);

    return exercise;
  }
}

module.exports = Exercises;
