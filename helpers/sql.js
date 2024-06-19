const { BadRequestError } = require("../expressError");

const sqlForPartialUpdate = (dataToUpdate, jsToSql) => {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {bodyPart: 'back', target: "lats"} => ['"body_part"=$1', '"target"=$2']
  const cols = keys.map(
    (colName, idx) => `"${jsToSql[colName] || colName}"=$${idx + 1}`
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
};

module.exports = {
  sqlForPartialUpdate,
};
