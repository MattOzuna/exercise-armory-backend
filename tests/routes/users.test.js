const request = require("supertest");
const app = require("../../app");
const db = require("../../db");

//==========================================================================//

beforeAll(async function () {
  await db.query("DELETE FROM users");
  await db.query(`
      INSERT INTO users (username, password, first_name, last_name, email)
      VALUES ('testuser1', 'password', 'Test', 'User', 'test1@email.com'), 
             ('testuser2', 'password', 'Test2', 'User2', 'test2@email.com')
      RETURNING username, first_name AS "firstName", last_name AS "lastName", email`);
});

afterAll(async function () {
  db.end();
});

//==========================================================================//

describe("GET /users", function () {
  it("works", async function () {
    const response = await request(app).get("/users");

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
});

//==========================================================================//

describe("GET /users/:username", function () {
  it("works", async function () {
    const response = await request(app).get("/users/testuser1");

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      user: {
        username: "testuser1",
        firstName: "Test",
        lastName: "User",
        email: "test1@email.com",
      },
    });
  });
  it("not found for no such user", async function () {
    const response = await request(app).get("/users/nope");
    expect(response.statusCode).toEqual(404);
  });
});

//==========================================================================//

describe("POST /users", function () {
  it("works", async function () {
    const response = await request(app).post("/users").send({
      username: "testuser3",
      password: "password",
      firstName: "Test3",
      lastName: "User3",
      email: "test3@email.com",
      isAdmin: true,
    });
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
    const response = await request(app).post("/users").send({
      username: "testuser4",
    });
    expect(response.statusCode).toEqual(400);
  });
  it("bad request with an invalid key", async function () {
    const response = await request(app).post("/users").send({
      username: "testuser5",
      password: "password",
      firstName: "Test5",
      lastName: "User5",
      email: "not-an-email",
      test: "test",
    });
    expect(response.statusCode).toEqual(400);
  });
});

//==========================================================================//

describe("PATCH /users/:username", function () {
  it("works", async function () {
    const response = await request(app).patch("/users/testuser1").send({
      password: "password",
      firstName: "Test1",
      lastName: "User1",
      email: "Newtest@email.com",
    });

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
    const response = await request(app).patch("/users/nope").send({
      password: "password",
      firstName: "Test1",
      lastName: "User1",
      email: "Newtest@email.com",
    });
    expect(response.statusCode).toEqual(404);
  });
  it("bad request on invalid data", async function () {
    const response = await request(app).patch("/users/testuser1").send({
      password: "password",
      firstName: "Test1",
      lastName: "User1",
      email: "not-an-email",
    });
    expect(response.statusCode).toEqual(400);
  });
  it("bad request on invalid password", async function () {
    const response = await request(app).patch("/users/testuser1").send({
      password: "nope",
      firstName: "Test1",
      lastName: "User1",
      email: "Newtest@email.com",
    });
  });
});

//==========================================================================//

describe("DELETE /users/:username", function () {
  it("works", async function () {
    const response = await request(app).delete("/users/testuser1");
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({ deleted: "testuser1" });
  });
  it("not found for no such user", async function () {
    const response = await request(app).delete("/users/nope");
    expect(response.statusCode).toEqual(404);
  });
});
