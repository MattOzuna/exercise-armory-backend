const request = require("supertest");
const app = require("../../app");
const User = require("../../models/users");
const db = require("../../db");

beforeAll(async () => {
  await User.register({
    username: "test",
    password: "password",
    firstName: "Test",
    lastName: "User",
    email: "test@email.com",
  });
});

afterAll(async () => {
  await db.query("DELETE FROM users");
  await db.end();
});

//==============================================================================//

describe("POST /auth/login", () => {
  it("should return a token on successful login", async () => {
    const response = await request(app)
      .post("/auth/login")
      .send({
        username: "test",
        password: "password",
      })
      .expect(200);
    expect(response.body).toEqual({ token: expect.any(String) });
  });
  it("should return a 401 if the password is incorrect", async () => {
    const response = await request(app)
      .post("/auth/login")
      .send({
        username: "test",
        password: "wrongpassword",
      })
      .expect(401);
    expect(response.body.error).toEqual({
      status: 401,
      message: "Invalid username/password",
    });
  });
  it("should return a 401 if the username is incorrect", async () => {
    const response = await request(app)
      .post("/auth/login")
      .send({
        username: "wrongusername",
        password: "password",
      })
      .expect(401);
    expect(response.body.error).toEqual({
      status: 401,
      message: "Invalid username/password",
    });
  });
  it('should return a 400 if the request body is missing a "username"', async () => {
    const response = await request(app)
      .post("/auth/login")
      .send({
        password: "password",
      })
      .expect(400);
    expect(response.body.error).toEqual({
      status: 400,
      message: ['instance requires property "username"'],
    });
  });
});

//==============================================================================//

describe("POST /auth/register", () => {
  it("should return a token on successful registration", async () => {
    const response = await request(app).post("/auth/register").send({
      username: "test2",
      password: "password",
      firstName: "Test",
      lastName: "User",
      email: "test@email.com",
    });
    expect(response.body).toEqual({ token: expect.any(String) });
  });
  it("should return a 400 if the request body is missing a required field", async () => {
    const response = await request(app).post("/auth/register").send({
      username: "test3",
      password: "password",
      firstName: "Test",
    });
    expect(response.body.error).toEqual({
      status: 400,
      message: [
        'instance requires property "lastName"',
        'instance requires property "email"',
      ],
    });
  });
});
