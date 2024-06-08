CREATE TABLE exercises (
    id SERIAL PRIMARY KEY,
    body_part TEXT NOT NULL,
    equipment TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    target TEXT NOT NULL,
    secondary_target TEXT[],
    instructions TEXT[] NOT NULL
);

CREATE TABLE users (
  username VARCHAR(25) PRIMARY KEY,
  password TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL
    CHECK (position('@' IN email) > 1),
  is_admin BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE workouts (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(25) REFERENCES users(username) ON DELETE CASCADE,
  date DATE NOT NULL,
  exercises INTEGER[] NOT NULL,
  notes TEXT
);

CREATE TABLE workouts_exercises (
  workout_id INTEGER REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id INTEGER REFERENCES exercises(id) ON DELETE CASCADE,
  sets INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  weight INTEGER
);