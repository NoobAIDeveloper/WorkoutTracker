# Gemini Context

This document provides context for the Workout Tracker project to be used by the Gemini AI assistant.

## Project Overview

This is a mobile-first web application designed to help users create and manage workout routines, and track their progress by logging weight and repetitions for each set performed during a workout session. The application is built with vanilla JavaScript, Tailwind CSS, and uses Supabase for the backend.

## Key Files

*   `index.html`: The main HTML file for the application. It contains the structure for all the different sections of the app, including the authentication, dashboard, routines, workout, and history sections. It also includes the Vercel analytics script.
*   `app.js`: This file contains all the JavaScript logic for the application. It handles user authentication, data fetching from Supabase, rendering of dynamic content, and all user interactions.
*   `supabase.js`: This file initializes the Supabase client.
*   `package.json`: This file contains the project's dependencies and scripts.
*   `PRD.md`: The Product Requirements Document, which outlines the project's goals, user stories, and technical requirements.
*   `supabase/migrations/20250730120000_create_profiles_table.sql`: The SQL migration file for creating the `profiles` table in the Supabase database.
*   `logo.png`: The application's logo.

## Project Structure

The project is structured as a single-page application. The `index.html` file contains all the necessary HTML for the different views, and the `app.js` file controls which view is displayed at any given time.

### Data Models

The application uses the following data models in Supabase:

*   **`routines`**: Stores the user-created workout routines.
    *   `id`: UUID, primary key
    *   `user_id`: UUID, foreign key to `auth.users`
    *   `name`: TEXT
    *   `exercises`: JSONB
*   **`workouts`**: Stores the user's workout history.
    *   `id`: UUID, primary key
    *   `user_id`: UUID, foreign key to `auth.users`
    *   `routine_id`: UUID, foreign key to `routines`
    *   `routine_name`: TEXT
    *   `date`: TIMESTAMPTZ
    *   `exercises`: JSONB
*   **`profiles`**: Stores user profile information.
    *   `user_id`: UUID, primary key, foreign key to `auth.users`
    *   `height`: NUMERIC
    *   `body_weight`: NUMERIC
    *   `weight_unit`: TEXT (either 'kg' or 'lbs')
    *   `dashboard_exercises`: JSONB (array of strings)

## How to Run the Project

1.  Install the dependencies with `npm install`.
2.  Create a `.env` file with your Supabase URL and Key.
3.  Add the `logo.png` file to the root of the project.
4.  Run the build script with `npm run build`.
5.  Serve the `public` directory with a static file server.