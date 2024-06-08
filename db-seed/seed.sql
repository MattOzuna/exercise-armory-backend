\echo 'Delete and recreate exercise_armory db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE exercise_armory;
CREATE DATABASE exercise_armory;
\connect exercise_armory

\i exercise-armory-schema.sql

\echo 'Delete and recreate exercise_armory_test db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE exercise_armory_test;
CREATE DATABASE exercise_armory_test;
\connect exercise_armory_test

\i exercise-armory-schema.sql
