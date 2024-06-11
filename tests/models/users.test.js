const db = require("../../db");
const User = require("../../models/users");
const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require("../../config");

//================================================================================================//

beforeAll(async function () {
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
});

afterAll(async function () {
  await db.query("DELETE FROM users");
  await db.end();
});

//================================================================================================//

describe("authenticate", function () {
  it("works", async function () {
    const user = await User.authenticate({
      username: "u1",
      password: "password1",
    });
    expect(user).toEqual({
      username: "u1",
      firstName: "U1F",
      lastName: "U1L",
      email: "u1@email.com",
    });
  });
  it("throws error if user not found", async function () {
    try {
      await User.authenticate({
        username: "nope",
        password: "password1",
      });
      fail();
    } catch (err) {
      expect(err.message).toEqual("Invalid username/password");
    }
  });
});

//================================================================================================//

describe("register", function () {
  it("works", async function () {
    const user = await User.register({
      username: "u3",
      password: "password3",
      firstName: "U3F",
      lastName: "U3L",
      email: "u3@email.com",
    });
    expect(user).toMatchObject({
      username: "u3",
      firstName: "U3F",
      lastName: "U3L",
      email: "u3@email.com",
      isAdmin: false,
    });
  });
  it("throws error if username taken", async function () {
    try {
      await User.register({
        username: "u1",
        password: "password3",
        firstName: "U3F",
        lastName: "U3L",
        email: "u3@email.com",
      });
      fail();
    } catch (err) {
      expect(err.message).toContain("Duplicate username: u1");
    }
  });
});

//================================================================================================//
describe("findAll", function () {
  it("works", async function () {
    const users = await User.findAll();
    expect(users).toEqual([
      {
        username: "u1",
        firstName: "U1F",
        lastName: "U1L",
        email: "u1@email.com",
      },
      {
        username: "u2",
        firstName: "U2F",
        lastName: "U2L",
        email: "u2@email.com",
      },
      {
        username: "u3",
        firstName: "U3F",
        lastName: "U3L",
        email: "u3@email.com",
      },
    ]);
  });
});

//================================================================================================//
describe("get", function () {
  it("works", async function () {
    const user = await User.get("u1");
    expect(user).toEqual({
      username: "u1",
      firstName: "U1F",
      lastName: "U1L",
      email: "u1@email.com",
    });
  });
  it("throws error if user not found", async function () {
    try {
      await User.get("nope");
      fail();
    } catch (err) {
      expect(err.message).toEqual("No user: nope");
    }
  });
});

//================================================================================================//
describe("update", function () {
  it("works", async function () {
    const user = await User.update("u1", {
      firstName: "NewF",
      lastName: "NewL",
      email: "new1@email.com",
    });
    expect(user).toEqual({
      username: "u1",
      firstName: "NewF",
      lastName: "NewL",
      email: "new1@email.com",
    });
  });
});

//================================================================================================//
describe("remove", function () {
    it("works", async function () {
        await User.remove("u3");
        const res = await db.query("SELECT * FROM users WHERE username='u3'");
        expect(res.rows.length).toEqual(0);
    });
    it("throws error if user not found", async function () {
        try {
        await User.remove("nope");
        fail();
        } catch (err) {
        expect(err.message).toEqual("No user: nope");
        }
    });
})
