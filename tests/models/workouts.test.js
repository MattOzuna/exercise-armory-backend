const db = require("../../db");
const Workouts = require("../../models/workouts");
const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require("../../config");

//================================================================================================//

beforeAll(async function () {
  await db.query("DELETE FROM workouts");
  await db.query("DELETE FROM exercises");
  await db.query("DELETE FROM users");

  await db.query(
    `
            INSERT INTO users (username, password, first_name, last_name, email)
            VALUES ('u1', $1, 'U1F', 'U1L', 'u1@email.com'),
                   ('u2', $2, 'U2F', 'U2L', 'u2@email.com')
            RETURNING username`,
    [
      await bcrypt.hash("password1", BCRYPT_WORK_FACTOR),
      await bcrypt.hash("password2", BCRYPT_WORK_FACTOR),
    ]
  );
  //adding a couple of exercises
  const exerciseData = [
    {
      name: "Push-ups",
      bodyPart: "Upper Body",
      equipment: "None",
      gifUrl: "test.gif",
      target: "Chest",
      secondaryMuscles: ["Triceps", "Shoulders"],
      instructions: [
        "Get into a plank position",
        "Lower your body until your chest nearly touches the floor",
        "Push your body back up to the starting position",
      ],
    },
    {
      name: "Sit-ups",
      bodyPart: "Core",
      equipment: "None",
      gifUrl: "test.gif",
      target: "Abs",
      secondaryMuscles: ["Obliques"],
      instructions: ["Lie on your back", "Bend your knees", "Sit up"],
    },
  ];

  //inserting the exercises into db
  await db.query(
    `
            INSERT INTO exercises (name, body_part, equipment, gif_url, target, secondary_muscles, instructions)
            VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      exerciseData[0].name,
      exerciseData[0].bodyPart,
      exerciseData[0].equipment,
      exerciseData[0].gifUrl,
      exerciseData[0].target,
      exerciseData[0].secondaryMuscles,
      exerciseData[0].instructions,
    ]
  );

  await db.query(
    `
            INSERT INTO exercises (name, body_part, equipment, gif_url, target, secondary_muscles, instructions)
            VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      exerciseData[1].name,
      exerciseData[1].bodyPart,
      exerciseData[1].equipment,
      exerciseData[1].gifUrl,
      exerciseData[1].target,
      exerciseData[1].secondaryMuscles,
      exerciseData[1].instructions,
    ]
  );
});

afterAll(async function () {
  await db.query("DELETE FROM workouts");
  await db.query("DELETE FROM users");
  await db.query("DELETE FROM exercises");
  db.end();
});

//================================================================================================//

describe("create", function () {
  it("works", async function () {
    const exercise1 = await db.query(
      "SELECT id FROM exercises WHERE name='Push-ups'"
    );
    const exercise2 = await db.query(
      "SELECT id FROM exercises WHERE name='Sit-ups'"
    );
    const workout = await Workouts.create({
      username: "u1",
      exercises: [exercise1.rows[0].id, exercise2.rows[0].id],
      notes: "test notes",
    });

    expect(workout).toEqual({
      id: expect.any(Number),
      username: "u1",
      exercises: [exercise1.rows[0].id, exercise2.rows[0].id],
      notes: "test notes",
    });
  });

  it('works with no notes', async function () {
    const exercise1 = await db.query(
      "SELECT id FROM exercises WHERE name='Push-ups'"
    );
    const exercise2 = await db.query(
      "SELECT id FROM exercises WHERE name='Sit-ups'"
    );
    const workout = await Workouts.create({
      username: "u1",
      exercises: [exercise1.rows[0].id, exercise2.rows[0].id],
    });

    expect(workout).toEqual({
      id: expect.any(Number),
      username: "u1",
      exercises: [exercise1.rows[0].id, exercise2.rows[0].id],
      notes: null,
    });
  })

  it('works with no exercises', async function () {
    const workout = await Workouts.create({
      username: "u1",
      notes: "test notes",
    });

    expect(workout).toEqual({
      id: expect.any(Number),
      username: "u1",
      exercises: [],
      notes: "test notes",
    });
  })
});

//================================================================================================//