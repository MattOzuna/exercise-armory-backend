const request = require("supertest");
const app = require("../../app");
const db = require("../../db");
const { createToken } = require("../../helpers/tokens");
const e = require("express");

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
  const date = new Date();
  const exercise1 = getExercises.rows[0].id;
  const exercise2 = getExercises.rows[1].id;
  const exercises = [exercise1, exercise2];
  await db.query(
    `
      INSERT INTO workouts (user_id, date, exercises, notes)
      VALUES ('testuser1', $1, $2, 'test notes')`,
    [date, exercises]
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

describe("GET /users", function () {
  it("works", async function () {
    const response = await request(app)
      .get("/users")
      .set("authorization", `Bearer ${testuser2Token}`);

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      users: [
        {
          username: "testuser1",
          firstName: "Test",
          lastName: "User",
          email: "test1@email.com",
        },
        {
          username: "testuser2",
          firstName: "Test2",
          lastName: "User2",
          email: "test2@email.com",
        },
      ],
    });
  });
  it("unauthorized for non-admin", async function () {
    const response = await request(app)
      .get("/users")
      .set("authorization", `Bearer ${testuser1Token}`);
    expect(response.statusCode).toEqual(401);
  });
});

//==========================================================================//

describe("GET /users/:username", function () {
  it("works for user", async function () {
    const exercises = await db.query(`SELECT id FROM exercises`);
    const exerciseIds = exercises.rows.map((e) => e.id);

    const response = await request(app)
      .get("/users/testuser1")
      .set("authorization", `Bearer ${testuser1Token}`);

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      user: {
        username: "testuser1",
        firstName: "Test",
        lastName: "User",
        email: "test1@email.com",
        workouts: [
          {
            id: expect.any(Number),
            username: "testuser1",
            date: expect.any(String),
            exercises: exerciseIds,
            notes: "test notes",
          },
        ],
      },
    });
  });
  it("works for admin", async function () {
    const exercises = await db.query(`SELECT id FROM exercises`);
    const exerciseIds = exercises.rows.map((e) => e.id);

    const response = await request(app)
      .get("/users/testuser1")
      .set("authorization", `Bearer ${testuser2Token}`);

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      user: {
        username: "testuser1",
        firstName: "Test",
        lastName: "User",
        email: "test1@email.com",
        workouts: [
          {
            id: expect.any(Number),
            username: "testuser1",
            date: expect.any(String),
            exercises: exerciseIds,
            notes: "test notes",
          },
        ],
      },
    });
  });
  it("unauthorized for non-admin", async function () {
    const response = await request(app)
      .get("/users/testuser2")
      .set("authorization", `Bearer ${testuser1Token}`);

    expect(response.statusCode).toEqual(401);
    expect(response.body).toEqual({
      error: {
        message: "Unauthorized",
        status: 401,
      },
    });
  });
  it("is not found for invalid user", async function () {
    const response = await request(app)
      .get("/users/nope")
      .set("authorization", `Bearer ${testuser2Token}`);
    expect(response.statusCode).toEqual(404);
  });
});

//==========================================================================//

describe("POST /users", function () {
  it("works", async function () {
    const response = await request(app)
      .post("/users")
      .send({
        username: "testuser3",
        password: "password",
        firstName: "Test3",
        lastName: "User3",
        email: "test3@email.com",
        isAdmin: true,
      })
      .set("authorization", `Bearer ${testuser2Token}`);
    expect(response.statusCode).toEqual(201);
    expect(response.body).toMatchObject({
      user: {
        username: "testuser3",
        firstName: "Test3",
        lastName: "User3",
        email: "test3@email.com",
        isAdmin: true,
      },
    });
  });
  it("bad request with missing data", async function () {
    const response = await request(app)
      .post("/users")
      .send({
        username: "testuser4",
      })
      .set("authorization", `Bearer ${testuser2Token}`);
    expect(response.statusCode).toEqual(400);
  });
  it("bad request with an invalid key", async function () {
    const response = await request(app)
      .post("/users")
      .send({
        username: "testuser5",
        password: "password",
        firstName: "Test5",
        lastName: "User5",
        email: "not-an-email",
        test: "test",
      })
      .set("authorization", `Bearer ${testuser2Token}`);
    expect(response.statusCode).toEqual(400);
  });
  it("unauthorized for non-admin", async function () {
    const response = await request(app)
      .post("/users")
      .send({
        username: "testuser6",
        password: "password",
        firstName: "Test6",
        lastName: "User6",
        email: "test3@email.com",
        isAdmin: true,
      })
      .set("authorization", `Bearer ${testuser1Token}`);
    expect(response.statusCode).toEqual(401);
  });
});

//==========================================================================//

describe("PATCH /users/:username", function () {
  it("works", async function () {
    const response = await request(app)
      .patch("/users/testuser1")
      .send({
        password: "password",
        firstName: "Test1",
        lastName: "User1",
        email: "Newtest@email.com",
      })
      .set("authorization", `Bearer ${testuser1Token}`);

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      user: {
        username: "testuser1",
        firstName: "Test1",
        lastName: "User1",
        email: "Newtest@email.com",
      },
    });
  });
  it("not found for no such user", async function () {
    const response = await request(app)
      .patch("/users/nope")
      .send({
        password: "password",
        firstName: "Test1",
        lastName: "User1",
        email: "Newtest@email.com",
      })
      .set("authorization", `Bearer ${testuser2Token}`);
    expect(response.statusCode).toEqual(404);
  });
  it("bad request on invalid data", async function () {
    const response = await request(app)
      .patch("/users/testuser1")
      .send({
        password: "password",
        firstName: "Test1",
        lastName: "User1",
        email: "not-an-email",
      })
      .set("authorization", `Bearer ${testuser1Token}`);
    expect(response.statusCode).toEqual(400);
  });
  it("bad request on invalid password", async function () {
    const response = await request(app)
      .patch("/users/testuser1")
      .send({
        password: "nope",
        firstName: "Test1",
        lastName: "User1",
        email: "Newtest@email.com",
      })
      .set("authorization", `Bearer ${testuser1Token}`);
  });
  it("unauthorized for non-admin", async function () {
    const response = await request(app)
      .patch("/users/testuser2")
      .send({
        password: "password",
        firstName: "Test1",
        lastName: "User1",
        email: "NewTest@email.com",
      })
      .set("authorization", `Bearer ${testuser1Token}`);
    expect(response.statusCode).toEqual(401);
  });
});

//==========================================================================//

describe("POST /users/:username/workouts", function () {
  it("works for admin", async function () {
    const exercise1 = await db.query(
      `SELECT id FROM exercises WHERE name = 'Push-ups'`
    );
    const exercise2 = await db.query(
      `SELECT id FROM exercises WHERE name = 'Sit-ups'`
    );
    const exercises = [exercise1.rows[0].id, exercise2.rows[0].id];

    const response = await request(app)
      .post("/users/testuser1/workouts")
      .send({
        exercises: exercises,
        notes: "test notes",
      })
      .set("authorization", `Bearer ${testuser2Token}`);
    expect(response.statusCode).toEqual(201);
    expect(response.body).toEqual({
      workout: {
        id: expect.any(Number),
        username: "testuser1",
        date: expect.any(String),
        exercises: exercises,
        notes: "test notes",
      },
    });
  });

  it("works for user", async function () {
    const exercise1 = await db.query(
      `SELECT id FROM exercises WHERE name = 'Push-ups'`
    );
    const exercise2 = await db.query(
      `SELECT id FROM exercises WHERE name = 'Sit-ups'`
    );
    const exercises = [exercise1.rows[0].id, exercise2.rows[0].id];

    const response = await request(app)
      .post("/users/testuser1/workouts")
      .send({
        exercises: exercises,
        notes: "test notes",
      })
      .set("authorization", `Bearer ${testuser1Token}`);
    expect(response.statusCode).toEqual(201);
    expect(response.body).toEqual({
      workout: {
        id: expect.any(Number),
        username: "testuser1",
        date: expect.any(String),
        exercises: exercises,
        notes: "test notes",
      },
    });
  });

  it("unauth for user", async function () {
    const response = await request(app)
      .post("/users/testuser2/workouts")
      .send({
        exercises: [],
        notes: "test notes",
      })
      .set("authorization", `Bearer ${testuser1Token}`);
    expect(response.statusCode).toEqual(401);
  });

  it("unauth for when not logged in", async function () {
    const response = await request(app)
      .post("/users/testuser1/workouts")
      .send({
        exercises: [1, 2],
        notes: "test notes",
      });
    expect(response.statusCode).toEqual(401);
  });

  it("bad request sent with non conforming data", async function () {
    const response = await request(app)
      .post("/users/testuser1/workouts")
      .send({ test: "test" })
      .set("authorization", `Bearer ${testuser2Token}`);
    expect(response.statusCode).toEqual(400);
  });
});

//==========================================================================//

describe("GET /users/:username/workouts/:id", function () {
  it("works for user", async function () {
    const workout = await db.query(
      `SELECT id FROM workouts WHERE user_id = 'testuser1'`
    );
    const workoutId = workout.rows[0].id;

    const exercise1 = await db.query(
      `SELECT id, 
              name, 
              body_part AS "bodyPart", 
              equipment, 
              gif_url AS "gifUrl", 
              target, 
              secondary_muscles AS "secondaryMuscles", 
              instructions 
            FROM exercises 
            WHERE name='Push-ups'`
    );
    const exercise2 = await db.query(
      `SELECT id, 
              name, 
              body_part AS "bodyPart", 
              equipment, 
              gif_url AS "gifUrl", 
              target, 
              secondary_muscles AS "secondaryMuscles", 
              instructions 
            FROM exercises 
            WHERE name='Sit-ups'`
    );

    const response = await request(app)
      .get(`/users/testuser1/workouts/${workoutId}`)
      .set("authorization", `Bearer ${testuser1Token}`);
    expect(response.body).toEqual({
      workout: {
        id: workoutId,
        username: "testuser1",
        date: expect.any(String),
        exercises: [exercise1.rows[0], exercise2.rows[0]],
        notes: "test notes",
      },
    });
  });

  it("works for admin", async function () {
    const workout = await db.query(
      `SELECT id FROM workouts WHERE user_id = 'testuser1'`
    );
    const workoutId = workout.rows[0].id;
    const exercise1 = await db.query(
      `SELECT id, 
              name, 
              body_part AS "bodyPart", 
              equipment, 
              gif_url AS "gifUrl", 
              target, 
              secondary_muscles AS "secondaryMuscles", 
              instructions 
            FROM exercises 
            WHERE name='Push-ups'`
    );
    const exercise2 = await db.query(
      `SELECT id, 
              name, 
              body_part AS "bodyPart", 
              equipment, 
              gif_url AS "gifUrl", 
              target, 
              secondary_muscles AS "secondaryMuscles", 
              instructions 
            FROM exercises 
            WHERE name='Sit-ups'`
    );

    const response = await request(app)
      .get(`/users/testuser1/workouts/${workoutId}`)
      .set("authorization", `Bearer ${testuser2Token}`);
    expect(response.body).toEqual({
      workout: {
        id: workoutId,
        username: "testuser1",
        date: expect.any(String),
        exercises: [exercise1.rows[0], exercise2.rows[0]],
        notes: "test notes",
      },
    });
  });
  
  it("unauthorized for non-admin", async function () {
    const workout = await db.query(
      `SELECT id FROM workouts WHERE user_id = 'testuser1'`
    );
    const workoutId = workout.rows[0].id;

    const response = await request(app)
      .get(`/users/testuser2/workouts/${workoutId}`)
      .set("authorization", `Bearer ${testuser1Token}`);
    expect(response.statusCode).toEqual(401);
  });
  it("is not found for invalid workout", async function () {
    const response = await request(app)
      .get(`/users/testuser1/workouts/0`)
      .set("authorization", `Bearer ${testuser1Token}`);
    expect(response.statusCode).toEqual(404);
  });
});

//==========================================================================//

describe("PATCH /users/:username/workouts/:id", function () {
  it("works for user", async function () {
    const workout = await db.query(
      `SELECT id FROM workouts WHERE user_id = 'testuser1'`
    );
    const workoutId = workout.rows[0].id;

    const exercise1 = await db.query(
      "SELECT id FROM exercises WHERE name='Push-ups'"
    );
    const exercise2 = await db.query(
      "SELECT id FROM exercises WHERE name='Sit-ups'"
    );

    const response = await request(app)
      .patch(`/users/testuser1/workouts/${workoutId}`)
      .send({
        exercises: [exercise1.rows[0].id, exercise2.rows[0].id],
        notes: "new notes",
      })
      .set("authorization", `Bearer ${testuser1Token}`);
    expect(response.body).toEqual({
      workout: {
        id: workoutId,
        username: "testuser1",
        date: expect.any(String),
        exercises: [exercise1.rows[0].id, exercise2.rows[0].id],
        notes: "new notes",
      },
    });
  });

  it("works for admin", async function () {
    const workout = await db.query(
      `SELECT id FROM workouts WHERE user_id = 'testuser1'`
    );
    const workoutId = workout.rows[0].id;

    const exercise1 = await db.query(
      "SELECT id FROM exercises WHERE name='Push-ups'"
    );
    const exercise2 = await db.query(
      "SELECT id FROM exercises WHERE name='Sit-ups'"
    );

    const response = await request(app)
      .patch(`/users/testuser1/workouts/${workoutId}`)
      .send({
        exercises: [exercise1.rows[0].id, exercise2.rows[0].id],
        notes: "new notes",
      })
      .set("authorization", `Bearer ${testuser2Token}`);
    expect(response.body).toEqual({
      workout: {
        id: workoutId,
        username: "testuser1",
        date: expect.any(String),
        exercises: [exercise1.rows[0].id, exercise2.rows[0].id],
        notes: "new notes",
      },
    });
  });

  it("unauthorized for non-admin", async function () {
    const workout = await db.query(
      `SELECT id FROM workouts WHERE user_id = 'testuser1'`
    );
    const workoutId = workout.rows[0].id;

    const exercise1 = await db.query(
      "SELECT id FROM exercises WHERE name='Push-ups'"
    );
    const exercise2 = await db.query(
      "SELECT id FROM exercises WHERE name='Sit-ups'"
    );

    const response = await request(app)
      .patch(`/users/testuser2/workouts/${workoutId}`)
      .send({
        exercises: [exercise1.rows[0].id, exercise2.rows[0].id],
        notes: "new notes",
      })
      .set("authorization", `Bearer ${testuser1Token}`);
    expect(response.statusCode).toEqual(401);
  });

  it("is not found for invalid workout", async function () {
    const exercise1 = await db.query(
      "SELECT id FROM exercises WHERE name='Push-ups'"
    );
    const exercise2 = await db.query(
      "SELECT id FROM exercises WHERE name='Sit-ups'"
    );

    const response = await request(app)
      .patch(`/users/testuser1/workouts/0`)
      .send({
        exercises: [exercise1.rows[0].id, exercise2.rows[0].id],
        notes: "new notes",
      })
      .set("authorization", `Bearer ${testuser1Token}`);
    expect(response.statusCode).toEqual(404);
  });
});

//==========================================================================//

describe("DELETE /users/:username", function () {
  it("works", async function () {
    const response = await request(app)
      .delete("/users/testuser1")
      .set("authorization", `Bearer ${testuser2Token}`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({ deleted: "testuser1" });
  });
  it("not found for no such user", async function () {
    const response = await request(app)
      .delete("/users/nope")
      .set("authorization", `Bearer ${testuser2Token}`);
    expect(response.statusCode).toEqual(404);
  });
  it("unauthorized for non-admin", async function () {
    const response = await request(app)
      .delete("/users/testuser2")
      .set("authorization", `Bearer ${testuser1Token}`);
    expect(response.statusCode).toEqual(401);
  });
});
