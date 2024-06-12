const db = require("../db");
const bcrypt = require("bcrypt");
const { sqlForPartialUpdate } = require("../helpers/sql.js");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");

const { BCRYPT_WORK_FACTOR } = require("../config.js");

class User {
  /**
   * Authenticate user with username and password.
   * @param {Object} data - { username, password }
   * @returns {Object} - user data
   * @throws {UnauthorizedError} - if invalid username/password
   */
  static async authenticate({ username, password }) {
    const result = await db.query(
      `SELECT username,
                    password,
                    first_name AS "firstName",
                    last_name AS "lastName",
                    email
            FROM users
            WHERE username = $1`,
      [username]
    );

    const user = result.rows[0];

    if (user) {
      const isValid = await bcrypt.compare(password, user.password);
      if (isValid === true) {
        delete user.password;
        return user;
      }
    }

    throw new UnauthorizedError("Invalid username/password");
  }

  //================================================================================================//
  /**
   * Register user with data.
   * @param {Object} data - { username, password, firstName, lastName, email }
   * @returns {Object} - user data
   * @throws {BadRequestError} - on duplicates
   */
  static async register({
    username,
    password,
    firstName,
    lastName,
    email,
    isAdmin=false,
  }) {
    const duplicateCheck = await db.query(
      `SELECT username
           FROM users
           WHERE username = $1`,
      [username]
    );

    if (duplicateCheck.rows[0]) {
      throw new BadRequestError(`Duplicate username: ${username}`);
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

    const result = await db.query(
      `INSERT INTO users
           (username,
            password,
            first_name,
            last_name,
            email,
            is_admin)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING username, first_name AS "firstName", last_name AS "lastName", email, created_at AS "createdAt", is_admin AS "isAdmin"`,
      [username, hashedPassword, firstName, lastName, email, isAdmin]
    );

    const user = result.rows[0];

    return user;
  }

  //================================================================================================//
  /**
   * find all users
   * @returns {Array} - [{ username, firstName, lastName, email }, ...]
   */
  static async findAll() {
    const usersRes = await db.query(
      `SELECT username,
                    first_name AS "firstName",
                    last_name AS "lastName",
                    email
            FROM users
            ORDER BY username`
    );
    return usersRes.rows;
  }

  //================================================================================================//
  /**
   * find user by username
   * @param {String} username
   * @returns {Object} - { username, firstName, lastName, email }
   * @throws {NotFoundError} - if user not found
   */
  static async get(username) {
    const userRes = await db.query(
      `SELECT username,
                    first_name AS "firstName",
                    last_name AS "lastName",
                    email
            FROM users
            WHERE username = $1`,
      [username]
    );

    const user = userRes.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);

    return user;
  }
  //================================================================================================//
  /**
   * update user by username
   * @param {string} username
   * @param {object} data
   * @returns {object} - { username, firstName, lastName, email }
   * @throws {NotFoundError} - if not found
   */
  static async update(username, data) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, BCRYPT_WORK_FACTOR);
    }

    //add updatedAt
    const timeStamp = new Date();
    data.updatedAt = timeStamp;

    const { setCols, values } = sqlForPartialUpdate(data, {
      firstName: "first_name",
      lastName: "last_name",
      updatedAt: "updated_at",
    });
    const usernameVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE users
                      SET ${setCols}
                      WHERE username = ${usernameVarIdx}
                      RETURNING username,
                                first_name AS "firstName",
                                last_name AS "lastName",
                                email`;

    const result = await db.query(querySql, [...values, username]);
    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);

    return user;
  }
  //================================================================================================//
  /**
   * remove user by username
   * @param {string} username
   * reurns {undefined}
   */
  static async remove(username) {
    let result = await db.query(
      `DELETE
           FROM users
           WHERE username = $1
           RETURNING username`,
      [username]
    );
    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);
  }
}

module.exports = User;
