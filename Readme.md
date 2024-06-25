# Exercise Armory Backend

This is the backend component of the Exercise Armory project. It provides the API endpoints for managing exercises. The backend was delpoyed using [Render](https://render.com/) and the database was deployed using [Neon Console](https://neon.tech/).

The frontend repo can be found [here](https://github.com/MattOzuna/exercise-armory-frontend).

## Installation
1. Clone the repository:

    ```bash
    git clone https://github.com/your-username/exercise-armory-backend.git
    ```

2. Install the dependencies:

    ```bash
    npm install
    ```

3. Start the server:

    ```bash
    npm start
    ```

## API Endpoints

Here is a link for more detailed API documentation using [Swagger Hub](https://app.swaggerhub.com/apis-docs/MOZUNA22/exercise-armory/1.0.0)

### /auth
- `POST /auth/register`: Register a new user.
- `POST /auth/login`: Log in an existing user.

### /exercises - Requires Authentication
- `GET /exercises`: Get all exercises.
- `GET /exercises/:id`: Get a specific exercise by ID.
- `POST /exercises`: ADMIN ONLY - Create a new exercise.
- `PUT /exercises/:id`: ADMIN ONLY - Update an existing exercise.
- `DELETE /exercises/:id`: ADMIN ONLY - Delete an exercise.

### /users - Requires Authentication
- `GET /users`: ADMIN ONLY - Get all users.
- `GET /users/:username`: Get a specific user by ID.
- `POST /users`: ADMIN ONLY - Create a new user.
- `PATCH /users/:username`: Update an existing user.
- `DELETE /users/:username`: ADMIN ONLY - Delete a user.
- `POST /users/:username/workouts`: Create a new workout
- `GET /users/:username/workouts/:id`: Get a specific workout
- `PATCH /users/:username/workouts/:id`: Add and delete exercises from workouts
- `PATCH /users/:username/workouts/:id/exercises`: Edit weight, reps and sets for specific exercises in a workout
- `DELETE /users/:username/workouts/:id`: delete a workout

## Technologies Used

- Node.js
- Express.js
- Postgres
- Bcrypt and JWT for authentication
