const db = require("../../db");
const Exercises = require("../../models/exercises");

afterEach(async function () {
  await db.query("DELETE FROM exercises");
});

afterAll(function () {
  db.end();
});

//=========================================create=====================================//
describe("create", () => {
  it("should create a new exercise", async () => {
    const exerciseData = {
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
    };

    //create exercise
    const exercise = await Exercises.create(exerciseData);

    expect(exercise.name).toBe(exerciseData.name);
    expect(exercise.description).toBe(exerciseData.description);
    expect(exercise.difficulty).toBe(exerciseData.difficulty);

    //verify exercise was created in database
    const result = await db.query("SELECT * FROM exercises WHERE name = $1", [
      exercise.name,
    ]);

    expect(result.rows.length).toBe(1);
    expect(result.rows[0].name).toBe(exerciseData.name);
    expect(result.rows[0].description).toBe(exerciseData.description);
    expect(result.rows[0].difficulty).toBe(exerciseData.difficulty);
  });
  it("should throw BadRequestError if exercise already exists", async () => {
    const exerciseData = {
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
    };

    await Exercises.create(exerciseData);

    try {
      await Exercises.create(exerciseData);
      fail();
    } catch (err) {
      expect(err.message).toBe(`Duplicate exercise: ${exerciseData.name}`);
    }
  });
});

//=========================================findALL=====================================//
describe("findAll", () => {
  it("should return all exercises", async () => {
    const exerciseData = {
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
    };

    //create exercise
    const exercise = await Exercises.create(exerciseData);

    //find all exercises
    const exercises = await Exercises.findAll();

    expect(exercises.length).toBe(1);
    expect(exercises[0].name).toBe(exerciseData.name);
    expect(exercises[0].description).toBe(exerciseData.description);
    expect(exercises[0].difficulty).toBe(exerciseData.difficulty);
  });
});

//=======================================find w/BodyPart query===================================//
describe("findByBodyPart", () => {
  it("should return exercises by body part", async () => {
    const exerciseData = {
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
    };

    //create exercise
    await Exercises.create(exerciseData);

    //find exercises by body part
    const exercises = await Exercises.findAll({ bodyPart: "Upper Body" });

    expect(exercises.length).toBe(1);
    expect(exercises[0].name).toBe(exerciseData.name);
    expect(exercises[0].description).toBe(exerciseData.description);
    expect(exercises[0].difficulty).toBe(exerciseData.difficulty);
  });
});

//=========================================find w/ body part and name queries=====================================//
describe("findByBodyPartAndName", () => {
  it("should return exercises by body part and name", async () => {
    const exerciseData = {
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
    };

    //create exercise
    await Exercises.create(exerciseData);

    //find exercises by body part and name
    const exercises = await Exercises.findAll({
      bodyPart: "Upper Body",
      name: "Push-ups",
    });

    expect(exercises.length).toBe(1);
    expect(exercises[0].name).toBe(exerciseData.name);
    expect(exercises[0].description).toBe(exerciseData.description);
    expect(exercises[0].difficulty).toBe(exerciseData.difficulty);
  });
});

//=========================================find w/ name query=====================================//
describe("findByName", () => {
  it("should return an exercise by name", async () => {
    const exerciseData = {
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
    };

    //create exercise
    await Exercises.create(exerciseData);

    //find exercise by name
    const foundExercise = await Exercises.findAll({ name: "Push-ups" });

    expect(foundExercise[0].name).toBe(exerciseData.name);
    expect(foundExercise[0].description).toBe(exerciseData.description);
    expect(foundExercise[0].difficulty).toBe(exerciseData.difficulty);
  });
});

//=========================================findById=====================================//
describe("findById", () => {
  it("should return an exercise by id", async () => {
    const exerciseData = {
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
    };

    //create exercise
    const exercise = await Exercises.create(exerciseData);

    //find exercise by id
    const foundExercise = await Exercises.findById(exercise.id);

    expect(foundExercise.name).toBe(exerciseData.name);
    expect(foundExercise.description).toBe(exerciseData.description);
    expect(foundExercise.difficulty).toBe(exerciseData.difficulty);
  });
  it("should throw NotFoundError if no exercise found", async () => {
    try {
      await Exercises.findById(1);
      fail();
    } catch (err) {
      expect(err.message).toBe("No exercise with id: 1");
    }
  });
});

//=========================================update=====================================//
describe("update", () => {
  it("should update an exercise", async () => {
    const exerciseData = {
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
    };

    //create exercise
    const exercise = await Exercises.create(exerciseData);

    const updateData = {
      name: "Sit-ups",
      bodyPart: "Core",
      equipment: "None",
      gifUrl: "test.gif",
      target: "Abs",
      secondaryMuscles: ["Obliques"],
      instructions: ["Lie on your back", "Bend your knees", "Sit up"],
    };

    //update exercise
    const updatedExercise = await Exercises.update(exercise.id, updateData);

    expect(updatedExercise.name).toBe(updateData.name);
    expect(updatedExercise.bodyPart).toBe(updateData.bodyPart);
    expect(updatedExercise.equipment).toBe(updateData.equipment);
    expect(updatedExercise.gifUrl).toBe(updateData.gifUrl);
    expect(updatedExercise.target).toBe(updateData.target);
    expect(updatedExercise.secondaryMuscles).toEqual(
      updateData.secondaryMuscles
    );
    expect(updatedExercise.instructions).toEqual(updateData.instructions);
  });
  it("should throw NotFoundError if exercise not found", async () => {
    try {
      await Exercises.update(1, {
        name: "Sit-ups",
        bodyPart: "Core",
        equipment: "None",
        gifUrl: "test.gif",
        target: "Abs",
        secondaryMuscles: ["Obliques"],
        instructions: ["Lie on your back", "Bend your knees", "Sit up"],
      });
      fail();
    } catch (err) {
      expect(err.message).toBe("No exercise with id: 1");
    }
  });
});

//=========================================delete=====================================//
describe("delete", function () {
  it("should delete an exercise", async function () {
    const exerciseData = {
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
    };

    //create exercise
    const exercise = await Exercises.create(exerciseData);

    //delete exercise
    await Exercises.delete(exercise.id);

    const res = await db.query("SELECT * FROM exercises WHERE id = $1", [
      exercise.id,
    ]);
    expect(res.rows.length).toBe(0);
  });

  it("should throw NotFoundError if exercise not found", async function () {
    try {
      await Exercises.delete(1);
      fail();
    } catch (err) {
      expect(err.message).toBe("No exercise w/ ID: 1");
    }
  });
});
