const db = require("../../db");
const Workouts = require("../../models/workouts");
const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require("../../config");
const e = require("cors");

//================================================================================================//
//Before all and After all for setting up and tearing down the database

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
      date: expect.any(Date),
      exercises: [exercise1.rows[0].id, exercise2.rows[0].id],
      notes: "test notes",
    });
  });

  it("works with no notes", async function () {
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
      date: expect.any(Date),
    });
  });

  it("works with no exercises", async function () {
    const workout = await Workouts.create({
      username: "u1",
      notes: "test notes",
    });

    expect(workout).toEqual({
      id: expect.any(Number),
      username: "u1",
      exercises: [],
      date: expect.any(Date),
      notes: "test notes",
    });
  });
  it("throws error if exercises not found", async function () {
    try {
      await Workouts.create({
        username: "u1",
        exercises: [0, 1],
        notes: "test notes",
      });
    } catch (err) {
      console.log(err);
      expect(err.message).toContain(`Exercise not found`);
    }
  });

  it("throws error if exercises not found", async function () {
    try {
      await Workouts.create({
        username: "u1",
        exercises: [0, 1],
        notes: "test notes",
      });
    } catch (err) {
      expect(err.message).toContain("Exercise not found");
    }
  });

  it("throws error if user not found", async function () {
    const exercise1 = await db.query(
      "SELECT id FROM exercises WHERE name='Push-ups'"
    );
    const exercise2 = await db.query(
      "SELECT id FROM exercises WHERE name='Sit-ups'"
    );

    try {
      await Workouts.create({
        username: "nope",
        exercises: [exercise1.rows[0].id, exercise2.rows[0].id],
        notes: "test notes",
      });
    } catch (err) {
      expect(err.message).toContain("No user: nope");
    }
  });
});

//================================================================================================//

describe("getAll", function () {
  it("works", async function () {
    const workouts = await Workouts.getAll("u1");
    expect(workouts).toEqual([
      {
        id: expect.any(Number),
        username: "u1",
        date: expect.any(Date),
        exercises: expect.any(Array),
        notes: "test notes",
      },
      {
        id: expect.any(Number),
        username: "u1",
        date: expect.any(Date),
        exercises: expect.any(Array),
        notes: null,
      },
      {
        id: expect.any(Number),
        username: "u1",
        date: expect.any(Date),
        exercises: expect.any(Array),
        notes: "test notes",
      },
    ]);
  });

  it("works with no workouts", async function () {
    const workouts = await Workouts.getAll("u2");
    expect(workouts).toEqual([]);
  });

  it("throws error if user not found", async function () {
    try {
      await Workouts.getAll("nope");
    } catch (err) {
      expect(err.message).toContain("No user: nope");
    }
  });
});

//================================================================================================//

describe("getOne", function () {
  it("works", async function () {
    const exercise1 = await db.query(
      `SELECT exercises.id, 
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
          FROM exercises
          JOIN workouts_exercises 
          ON exercises.id = workouts_exercises.exercise_id
          WHERE exercises.name = 'Push-ups'`
    );
    const exercise2 = await db.query(
      `SELECT exercises.id, 
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
          FROM exercises
          INNER JOIN workouts_exercises 
          ON exercises.id = workouts_exercises.exercise_id
          WHERE exercises.name = 'Sit-ups'`
    );
    const workout = await Workouts.create({
      username: "u1",
      exercises: [exercise1.rows[0].id, exercise2.rows[0].id],
      notes: "test notes",
    });

    const workoutId = workout.id;
    const workoutData = await Workouts.get(workoutId);

    expect(workoutData).toEqual({
      id: workoutId,
      username: "u1",
      date: expect.any(Date),
      exercises: [exercise1.rows[0], exercise2.rows[0]],
      notes: "test notes",
    });
  });
  it("throws error if workout not found", async function () {
    try {
      await Workouts.get(0);
    } catch (err) {
      expect(err.message).toContain("No workout: 0");
    }
  });
});

//================================================================================================//

describe("update", function () {
  it("works", async function () {
    const workout = await Workouts.getAll("u1");
    const workoutId = workout[0].id;

    const exercise1 = await db.query(
      "SELECT id FROM exercises WHERE name='Push-ups'"
    );
    const exercise2 = await db.query(
      "SELECT id FROM exercises WHERE name='Sit-ups'"
    );

    const exercise3 = await db.query(
      `INSERT INTO exercises (name, body_part, equipment, gif_url, target, secondary_muscles, instructions)
            VALUES ('Pull-ups', 
                    'Upper Body', 
                    'Pull-up bar', 
                    'test.gif', 
                    'Back', 
                    '{Shoulders, Biceps}', 
                    '{Get on the bar, Pull yourself up, Lower yourself down}')
            RETURNING id`
    );
    const updatedWorkout = await Workouts.update(workoutId, {
      exercises: [
        exercise1.rows[0].id,
        exercise2.rows[0].id,
        exercise3.rows[0].id,
      ],
      notes: "updated notes",
    });

    expect(updatedWorkout).toEqual({
      id: workoutId,
      username: "u1",
      date: expect.any(Date),
      exercises: [
        exercise1.rows[0].id,
        exercise2.rows[0].id,
        exercise3.rows[0].id,
      ],
      notes: "updated notes",
    });
  });

  it("works with no notes", async function () {
    const workout = await Workouts.getAll("u1");
    const workoutId = workout[0].id;

    const exercise1 = await db.query(
      `SELECT id FROM exercises WHERE name='Push-ups'`
    );
    const exercise2 = await db.query(
      `SELECT id FROM exercises WHERE name='Sit-ups'`
    );

    const updatedWorkout = await Workouts.update(workoutId, {
      exercises: [exercise1.rows[0].id, exercise2.rows[0].id],
    });

    expect(updatedWorkout).toEqual({
      id: workoutId,
      username: "u1",
      date: expect.any(Date),
      exercises: [exercise1.rows[0].id, exercise2.rows[0].id],
      notes: null,
    });
  });

  it("throws error if exercises not found", async function () {
    const workout = await Workouts.getAll("u1");
    const workoutId = workout[0].id;

    try {
      await Workouts.update(workoutId, {
        exercises: [0, 1],
        notes: "test notes",
      });
    } catch (err) {
      expect(err.message).toContain(`Exercise not found`);
    }
  });

  it("throws error if workout not found", async function () {
    const exercise1 = await db.query(
      `SELECT id FROM exercises WHERE name='Push-ups'`
    );
    const exercise2 = await db.query(
      `SELECT id FROM exercises WHERE name='Sit-ups'`
    );

    try {
      await Workouts.update(0, {
        exercises: [exercise1.rows[0].id, exercise2.rows[0].id],
        notes: "test notes",
      });
    } catch (err) {
      expect(err.message).toContain("No workout: 0");
    }
  });
});

//================================================================================================//

describe("update workout Details", function () {
  it("works", async function () {
    const workout = await Workouts.getAll("u1");
    const workoutId = workout[1].id;

    const exerciseDetails = workout[1].exercises.map((exercise) => {
      return {
        exerciseId: exercise,
        weight: 50,
        reps: 10,
        sets: 3,
      };
    });

    const updatedWorkout = await Workouts.updateWorkoutExerciseDetails(
      workoutId,
      exerciseDetails
    );

    expect(updatedWorkout).toEqual({
      workoutId,
      exercises: exerciseDetails,
    });
  });
  it("throws error if workout not found", async function () {
    try {
      await Workouts.updateWorkoutExerciseDetails(0, [
        { exerciseId: 1, weight: 50, reps: 10, sets: 3 },
      ]);
    } catch (err) {
      expect(err.message).toContain("No workout: 0");
    }
  });
  it("throws and error if exercise not found", async function () {
    const workout = await Workouts.getAll("u1");
    const workoutId = workout[1].id;

    try {
      await Workouts.updateWorkoutExerciseDetails(workoutId, [
        { exerciseId: 0 },
      ]);
    } catch (err) {
      expect(err.message).toContain(`No workout: ${workoutId} or exercise: 0`);
    }
  });
});

//================================================================================================//

describe("delete", function () {
  it("works", async function () {
    const workout = await Workouts.getAll("u1");
    const workoutId = workout[0].id;

    await Workouts.delete(workoutId);
    const res = await db.query(`SELECT id FROM workouts WHERE id=$1`, [
      workoutId,
    ]);

    expect(res.rows.length).toEqual(0);
  });

  it("throws error if workout not found", async function () {
    try {
      await Workouts.delete(0);
    } catch (err) {
      expect(err.message).toContain("No workout: 0");
    }
  });
});
