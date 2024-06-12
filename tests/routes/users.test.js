const request = require("supertest");
const app = require("../../app");
const db = require("../../db");
const { createToken } = require("../../helpers/tokens");

//==========================================================================//

beforeAll(async function () {
  await db.query("DELETE FROM users");
  // Add some users
  //testuser1 is not an admin
  //testuser2 is an admin
  await db.query(`
      INSERT INTO users (username, password, first_name, last_name, email, is_admin)
      VALUES ('testuser1', 'password', 'Test', 'User', 'test1@email.com', false), 
             ('testuser2', 'password', 'Test2', 'User2', 'test2@email.com', true)
      RETURNING username, first_name AS "firstName", last_name AS "lastName", email`);
});

afterAll(async function () {
  await db.query("DELETE FROM users");
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
      },
    });
  });
  it("works for admin", async function () {
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
