const request = require("supertest");
const app = require("../../app");
const db = require("../../db");

const { createToken } = require("../../helpers/tokens");

//==========================================================================//

beforeAll(async function () {
  await db.query("DELETE FROM users");
  await db.query("DELETE FROM exercises");
  await db.query("DELETE FROM workouts");
  // Add some users
  //testuser1 is not an admin
  //testuser2 is an admin
  await db.query(`
      INSERT INTO users (username, password, first_name, last_name, email, is_admin)
      VALUES ('testuser1', 'password', 'Test', 'User', 'test1@email.com', false), 
             ('testuser2', 'password', 'Test2', 'User2', 'test2@email.com', true)
      RETURNING username, first_name AS "firstName", last_name AS "lastName", email`);

  // Add some exercises
  const getExercises = await db.query(`
      INSERT INTO exercises (name, body_part, equipment, gif_url, target, secondary_muscles, instructions)
      VALUES ('Push-ups', 'Upper Body', 'None', 'test.gif', 'Chest', ARRAY['Triceps', 'Shoulders'], ARRAY['Get into a plank position', 'Lower your body until your chest nearly touches the floor', 'Push your body back up to the starting position']),
             ('Sit-ups', 'Core', 'None', 'test.gif', 'Abs', ARRAY['Obliques'], ARRAY['Lie on your back', 'Bend your knees', 'Sit up'])
      RETURNING id`);

  // Add some workouts
  const date1 = new Date();
  const date2 = new Date();
  const exercise1 = getExercises.rows[0].id;
  const exercise2 = getExercises.rows[1].id;
  const exercises = [exercise1, exercise2];
  await db.query(
    `
      INSERT INTO workouts (user_id, date, exercises, notes)
      VALUES ('testuser1', $1, $2, 'test notes'), 
              ('testuser1', $3, $4, 'test2 notes')`,
    [date1, exercises, date2, exercises]
  );
});

afterAll(async function () {
  await db.query("DELETE FROM users");
  await db.query("DELETE FROM exercises");
  await db.query("DELETE FROM workouts");
  db.end();
});

const testuser1Token = createToken({ username: "testuser1", isAdmin: false });
const testuser2Token = createToken({ username: "testuser2", isAdmin: true });

//==========================================================================//

describe("GET /workouts", function () {
  test("works for admin", async function () {
    const response = await request(app)
      .get("/workouts")
      .send({ username: "testuser1" })
      .set("authorization", `Bearer ${testuser2Token}`);
    expect(response.body).toEqual({
      workouts: [
        {
          id: expect.any(Number),
          username: "testuser1",
          date: expect.any(String),
          exercises: [expect.any(Number), expect.any(Number)],
          notes: "test notes",
        },
        {
          id: expect.any(Number),
          username: "testuser1",
          date: expect.any(String),
          exercises: [expect.any(Number), expect.any(Number)],
          notes: "test2 notes",
        },
      ],
    });
  });

  test("unauth for non-admin", async function () {
    const response = await request(app)
      .get("/workouts")
      .send({ username: "testuser2" })
      .set("authorization", `Bearer ${testuser1Token}`);
    expect(response.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const response = await request(app).get("/workouts");
    expect(response.statusCode).toEqual(401);
  });
});
