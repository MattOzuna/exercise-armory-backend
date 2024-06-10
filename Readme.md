# Exercise Armory Backend

This is the backend component of the Exercise Armory project. It provides the API endpoints for managing exercises.

## Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/your-username/exercise-armory-backend.git
    ```

2. Install the dependencies:

    ```bash
    npm install
    ```

3. Set up the environment variables:

    - Create a `.env` file in the root directory.
    - Add the following variables:

      ```plaintext
      PORT=3000
      DATABASE_URL=postgresql:///exercise_armory
      ```

4. Start the server:

    ```bash
    npm start
    ```

## API Endpoints

- `GET /exercises`: Get all exercises.
- `GET /exercises/:id`: Get a specific exercise by ID.
- `POST /exercises`: Create a new exercise.
- `PUT /exercises/:id`: Update an existing exercise.
- `DELETE /exercises/:id`: Delete an exercise.

## Technologies Used

- Node.js
- Express.js
- Postgres

## Contributing

Contributions are welcome! If you find any issues or have suggestions for improvements, please open an issue or submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE).