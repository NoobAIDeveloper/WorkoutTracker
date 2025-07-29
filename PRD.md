# Product Requirements Document: Mobile-First Workout Tracker Web App

## 1. Introduction

This document outlines the requirements for a mobile-first web application designed to help users create and manage workout routines, and track their progress by logging weight and repetitions for each set performed during a workout session. The primary goal is to provide a simple, intuitive, and efficient tool for personal workout management.

## 2. Goals

* Enable users to easily define and organize their workout routines.
* Provide a straightforward interface for logging workout sets (weight and reps).
* Ensure a seamless and responsive user experience on mobile devices.
* Persist user data (routines and workout logs) securely.

## 3. User Stories

### Routine Management

* As a user, I want to create a new workout routine so I can define my exercise plan.
* As a user, I want to give my routine a name (e.g., "Leg Day", "Upper Body") so I can easily identify it.
* As a user, I want to add multiple exercises to a routine so my routine is comprehensive.
* As a user, I want to specify the name of each exercise (e.g., "Squats", "Bench Press") within a routine.
* As a user, I want to edit an existing routine's name or exercises so I can adjust my plan.
* As a user, I want to delete a routine so I can remove old or unused plans.
* As a user, I want to view a list of all my created routines so I can easily select one.

### Workout Tracking

* As a user, I want to select an existing routine to start a workout session.
* As a user, for each exercise in the selected routine, I want to add multiple sets.
* As a user, for each set, I want to record the weight used (e.g., "kg" or "lbs") and the number of repetitions performed.
* As a user, I want to see the exercises and sets I've logged during the current workout session.
* As a user, I want to be able to edit or delete a logged set during the current workout session.
* As a user, I want to mark a workout session as complete, saving all logged data.
* As a user, I want to view my past workout sessions, including the routine used and the logged sets for each exercise.

## 4. Features

### 4.1. Routine Management

* **Routine Creation:**
    * Form to input routine name.
    * Ability to add multiple exercises to the routine.
    * For each exercise: input field for exercise name.
* **Routine Listing:**
    * Display a list of all saved routines.
    * Each routine entry should be clickable to view/edit or start a workout.
* **Routine Editing:**
    * Edit routine name.
    * Add/remove exercises from an existing routine.
    * Edit individual exercise names within a routine.
* **Routine Deletion:**
    * Option to delete a routine.

### 4.2. Workout Tracking

* **Workout Start:**
    * Select a routine from the list to begin a new workout session.
    * Display the exercises defined in the chosen routine.
* **Set Logging:**
    * For each exercise, provide input fields to log `Weight` (numeric) and `Reps` (numeric).
    * Button to "Add Set" for the current exercise.
    * Display a list of logged sets under each exercise for the current session.
* **In-Workout Editing:**
    * Ability to edit `Weight` and `Reps` for a set already logged in the current session.
    * Ability to delete a set already logged in the current session.
* **Workout Completion:**
    * "Complete Workout" button to save all logged data for the session.
    * Timestamp the completed workout session.
* **Workout History:**
    * Display a list of past workout sessions (e.g., by date and routine name).
    * Clicking a past session should display the routine details and all logged sets for that specific workout.

### 4.3. User Interface (UI) / User Experience (UX)

* **Mobile-First Design:** The application must be fully responsive and optimized for mobile devices, ensuring an excellent user experience on small screens.
* **Intuitive Navigation:** Clear and easy-to-understand navigation between routine management, workout tracking, and history.
* **Clean and Minimalist Design:** Focus on usability and readability, avoiding clutter.
* **Feedback:** Provide visual feedback for user actions (e.g., successful save, error messages).

## 5. Technical Requirements

* **Frontend Technologies:**
    * HTML5 for structure.
    * Tailwind CSS for styling (mobile-first approach, responsive utility classes).
    * Vanilla JavaScript for interactivity and logic.
    * No external UI frameworks (e.g., React, Vue) unless explicitly requested later.
* **Data Storage (Backend):**
    * Supabase: Used for persisting user routines and workout logs. This will involve a PostgreSQL database.
    * **Data Models (Supabase Tables):**
        * **`routines` Table:**
            * `id` (UUID, primary key)
            * `user_id` (UUID, linked to Supabase Auth `auth.users` table)
            * `name` (TEXT, e.g., "Leg Day")
            * `exercises` (JSONB, array of objects, each with `name` TEXT)
        * **`workouts` Table:**
            * `id` (UUID, primary key)
            * `user_id` (UUID, linked to Supabase Auth `auth.users` table)
            * `routine_id` (UUID, foreign key referencing `routines.id`)
            * `routine_name` (TEXT, name of the routine at the time of workout)
            * `date` (TIMESTAMP WITH TIME ZONE)
            * `exercises` (JSONB, array of objects, each with `name` TEXT and `sets` JSONB array)
                * `sets` (JSONB array of objects, each with `weight` NUMERIC and `reps` INTEGER)
* **Authentication:**
    * Supabase Auth: Used for user authentication. The application will handle user sign-in/sign-up and session management.
    * User ID (`auth.user().id`) must be used for all data storage to ensure data isolation.
* **Real-time Updates:** Utilize Supabase's Realtime capabilities for live updates to routines and workout history where applicable.
* **Error Handling:** Implement robust error handling for all Supabase operations and user inputs.
* **Deployment:** The application should be deployable as a static web app.

## 6. Future Enhancements (Out of Scope for Initial Release)

* User accounts and persistent login (beyond initial token/anonymous).
* Progress charts and analytics (e.g., weight lifted over time, rep max).
* Pre-defined exercise library.
* Sharing routines with others.
* Rest timer.
* Support for different units (kg/lbs toggle).