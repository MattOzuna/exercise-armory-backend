const request = require("supertest");
const app = require("../../app");
const db = require("../../db");

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

describe("Exercise Routes", () => {
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
