const request = require("supertest");
const app = require("../../app");
const db = require("../../db");

//==========================================================================//

beforeAll(async function () {
  await db.query("DELETE FROM exercises");
  await db.query(`
    INSERT INTO exercises (name, body_part, equipment, gif_url, target, secondary_muscles, instructions)
    VALUES ('running', 'legs', 'none', 'running.gif', 'cardio', '{quads, hamstrings}', '{run}')
  `);
});

afterAll(async function () {
  db.end();
});

//==========================================================================//

describe("GET /exercises", () => {
  it("should return a list of exercises", async () => {
    const result = await db.query(
      "SELECT id FROM exercises WHERE name='running'"
    );
    const response = await request(app).get("/exercises").expect(200);

    expect(response.body).toMatchObject({
      exercises: [
        {
          id: result.rows[0].id,
          name: "running",
          body_part: "legs",
          equipment: "none",
          gif_url: "running.gif",
          target: "cardio",
          secondary_muscles: ["quads", "hamstrings"],
          instructions: ["run"],
        },
      ],
    });
  });
});

//==========================================================================//

describe("GET /exercises?name=exerciseName", () => {
  it("should return a list of exercises with the specified name", async () => {
    const result = await db.query(
      "SELECT id FROM exercises WHERE name='running'"
    );
    const response = await request(app)
      .get("/exercises?name=running")
      .expect(200);

    expect(response.body).toMatchObject({
      exercises: [
        {
          id: result.rows[0].id,
          name: "running",
          body_part: "legs",
          equipment: "none",
          gif_url: "running.gif",
          target: "cardio",
          secondary_muscles: ["quads", "hamstrings"],
          instructions: ["run"],
        },
      ],
    });
  });
});

//==========================================================================//

describe("GET /exercises?bodyPart=bodypart", () => {
  it("should return a list of exercises with the specified body part", async () => {
    const result = await db.query(
      "SELECT id FROM exercises WHERE name='running'"
    );
    const response = await request(app)
      .get("/exercises?body_part=legs")
      .expect(200);

    expect(response.body).toMatchObject({
      exercises: [
        {
          id: result.rows[0].id,
          name: "running",
          body_part: "legs",
          equipment: "none",
          gif_url: "running.gif",
          target: "cardio",
          secondary_muscles: ["quads", "hamstrings"],
          instructions: ["run"],
        },
      ],
    });
  });
});

//==========================================================================//

describe("GET /exercises?name=exerciseName&bodyPart=bodypart", () => {
  it("should return a list of exercises with the specified name and body part", async () => {
    const result = await db.query(
      "SELECT id FROM exercises WHERE name='running'"
    );

    await db.query(`
      INSERT INTO exercises (name, body_part, equipment, gif_url, target, secondary_muscles, instructions)
      VALUES ('runningv2', 'arms', 'none', 'running.gif', 'cardio', '{quads, hamstrings}', '{run}')
    `);

    const response = await request(app)
      .get("/exercises?name=running&bodyPart=legs")
      .expect(200);

    expect(response.body).toMatchObject({
      exercises: [
        {
          id: result.rows[0].id,
          name: "running",
          body_part: "legs",
          equipment: "none",
          gif_url: "running.gif",
          target: "cardio",
          secondary_muscles: ["quads", "hamstrings"],
          instructions: ["run"],
        },
      ],
    });
  });
});

//==========================================================================//

describe("GET /exercises/id", () => {
  it("should return a single exercise", async () => {
    const result = await db.query(
      "SELECT id FROM exercises WHERE name='running'"
    );
    const response = await request(app)
      .get(`/exercises/${result.rows[0].id}`)
      .expect(200);

    expect(response.body).toMatchObject({
      exercise: {
        id: result.rows[0].id,
        name: "running",
        body_part: "legs",
        equipment: "none",
        gif_url: "running.gif",
        target: "cardio",
        secondary_muscles: ["quads", "hamstrings"],
        instructions: ["run"],
      },
    });
  });

  it("should throw a 404 error if the exercise does not exist", async () => {
    await request(app).get("/exercises/0").expect(404);
  });
});

//==========================================================================//

describe("POST /exercises", () => {
  it("should create a new exercise", async () => {
    const response = await request(app)
      .post("/exercises")
      .send({
        name: "test-test",
        bodyPart: "chest",
        equipment: "none",
        gifUrl: "push-up.gif",
        target: "strength",
        secondaryMuscles: ["triceps", "shoulders"],
        instructions: ["push"],
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toMatchObject({
      exercise: {
        name: "test-test",
        bodyPart: "chest",
        equipment: "none",
        gifUrl: "push-up.gif",
        target: "strength",
        secondaryMuscles: ["triceps", "shoulders"],
        instructions: ["push"],
      },
    });
  });
  it("should throw a 400 error if the request body is invalid", async () => {
    await request(app).post("/exercises").send({}).expect(400);
  });
});

//==========================================================================//

describe("PATCH /exercises", () => {
  it("should update an exercise", async () => {
    const result = await db.query(
      "SELECT id FROM exercises WHERE name='running'"
    );
    const response = await request(app)
      .patch(`/exercises/${result.rows[0].id}`)
      .send({
        bodyPart: "arms",
        target: "core",
        instructions: ["test", "jog"],
      })
      .expect(200);

    expect(response.body).toMatchObject({
      exercise: {
        id: result.rows[0].id,
        name: "running",
        bodyPart: "arms",
        equipment: "none",
        gifUrl: "running.gif",
        target: "core",
        secondaryMuscles: ["quads", "hamstrings"],
        instructions: ["test", "jog"],
      },
    });
  });
});
//==========================================================================//

describe("DELETE /exercises", () => {
  it("should delete an exercise", async () => {
    const result = await db.query(
      "SELECT id FROM exercises WHERE name='running'"
    );
    const response = await request(app)
      .delete(`/exercises/${result.rows[0].id}`)
      .expect(200);

    expect(response.body).toMatchObject({ deleted: `${result.rows[0].id}` });
  });

  it("should throw a 404 error if the exercise does not exist", async () => {
    await request(app).delete("/exercises/0").expect(404);
  });
});
