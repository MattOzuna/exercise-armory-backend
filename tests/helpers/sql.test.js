const { sqlForPartialUpdate } = require("../../helpers/sql");

describe("sqlForPartialUpdate", () => {
  test("works: 1 item", () => {
    const result = sqlForPartialUpdate({ key1: "val1" }, { key1: "key_1" });

    expect(result).toEqual({
      setCols: '"key_1"=$1',
      values: ["val1"],
    });
  });
  test("works: exercise item", () => {
    const result = sqlForPartialUpdate(
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
        bodyPart: "body_part",
        gifUrl: "gif_url",
        secondaryMuscles: "secondary_muscles",
      }
    );

    expect(result).toEqual({
      setCols:
        '"name"=$1, "body_part"=$2, "equipment"=$3, "gif_url"=$4, "target"=$5, "secondary_muscles"=$6, "instructions"=$7',
      values: [
        "Push-ups",
        "Upper Body",
        "None",
        "test.gif",
        "Chest",
        ["Triceps", "Shoulders"],
        [
          "Get into a plank position",
          "Lower your body until your chest nearly touches the floor",
          "Push your body back up to the starting position",
        ],
      ],
    });
  });
});
