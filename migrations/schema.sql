CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT,
  height TEXT,
  weight TEXT,
  goal TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE training_plans (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  day_of_week TEXT,
  exercise TEXT,
  sets INTEGER,
  reps INTEGER
);

CREATE TABLE workout_records (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  plan_id INTEGER REFERENCES training_plans(id),
  completed BOOLEAN,
  actual_reps INTEGER,
  date DATE
);
