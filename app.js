

import { supabase } from './supabase.js';

document.addEventListener('DOMContentLoaded', () => {
    // Sections
    const authSection = document.getElementById('auth-section');
    const appSection = document.getElementById('app-section');
    const routinesSection = document.getElementById('routines-section');
    const routineFormSection = document.getElementById('routine-form-section');
    const workoutSection = document.getElementById('workout-section');
    const historySection = document.getElementById('history-section');

    // Auth Elements
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const authForm = document.getElementById('auth-form');
    const authTitle = document.getElementById('auth-title');
    const authSwitchLink = document.getElementById('auth-switch-link');
    const authMessage = document.getElementById('auth-message');
    let isLogin = true;

    // Main App Buttons
    const addRoutineBtn = document.getElementById('add-routine-btn');
    const cancelRoutineBtn = document.getElementById('cancel-routine-btn');
    const addExerciseBtn = document.getElementById('add-exercise-btn');
    const backToRoutinesBtn = document.getElementById('back-to-routines-btn');
    const cancelWorkoutBtn = document.getElementById('cancel-workout-btn');
    const viewHistoryBtn = document.getElementById('view-history-btn');

    // Form Elements
    const routineForm = document.getElementById('routine-form');
    const routineFormTitle = document.getElementById('routine-form-title');
    const routineIdInput = document.getElementById('routine-id');
    const routineNameInput = document.getElementById('routine-name');
    const exercisesContainer = document.getElementById('exercises-container');

    // Lists
    const routinesList = document.getElementById('routines-list');
    const workoutExercisesList = document.getElementById('workout-exercises-list');
    const historyList = document.getElementById('history-list');

    let currentUser = null;

    // --- Authentication --- //

    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            currentUser = session.user;
            authSection.classList.add('hidden');
            appSection.classList.remove('hidden');
            loadRoutines();
            showSection('routines');
        } else {
            currentUser = null;
            authSection.classList.remove('hidden');
            appSection.classList.add('hidden');
        }
    };

    authSwitchLink.addEventListener('click', (e) => {
        e.preventDefault();
        isLogin = !isLogin;
        authTitle.textContent = isLogin ? 'Login' : 'Sign Up';
        authForm.querySelector('button[type="submit"]').textContent = isLogin ? 'Login' : 'Sign Up';
        authSwitchLink.textContent = isLogin ? 'Need an account? Sign Up' : 'Have an account? Login';
        authMessage.textContent = '';
        authForm.reset();
    });

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = e.target.email.value;
        const password = e.target.password.value;
        let error = null;

        if (isLogin) {
            const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
            error = loginError;
        } else {
            const { error: signUpError } = await supabase.auth.signUp({ email, password });
            error = signUpError;
            if (!error) {
                 alert('Sign up successful! Please check your email to confirm.');
            }
        }

        if (error) {
            authMessage.textContent = error.message;
        } else {
            authMessage.textContent = '';
            checkUser();
        }
    });

    logoutBtn.addEventListener('click', async () => {
        await supabase.auth.signOut();
        checkUser();
    });


    // --- Navigation --- //

    function showSection(sectionName) {
        routinesSection.classList.add('hidden');
        routineFormSection.classList.add('hidden');
        workoutSection.classList.add('hidden');
        historySection.classList.add('hidden');

        const sectionMap = {
            'routines': routinesSection,
            'routine-form': routineFormSection,
            'workout': workoutSection,
            'history': historySection,
        };

        if (sectionMap[sectionName]) {
            sectionMap[sectionName].classList.remove('hidden');
        }
    }

    addRoutineBtn.addEventListener('click', () => {
        routineFormTitle.textContent = 'Add Routine';
        routineForm.reset();
        routineIdInput.value = '';
        exercisesContainer.innerHTML = '';
        addExerciseInput();
        showSection('routine-form');
    });

    cancelRoutineBtn.addEventListener('click', () => showSection('routines'));
    backToRoutinesBtn.addEventListener('click', () => showSection('routines'));
    cancelWorkoutBtn.addEventListener('click', () => showSection('routines'));
    viewHistoryBtn.addEventListener('click', () => {
        loadWorkoutHistory();
        showSection('history');
    });


    // --- Routine Management --- //

    addExerciseBtn.addEventListener('click', () => addExerciseInput());

    function addExerciseInput(name = '') {
        const div = document.createElement('div');
        div.className = 'flex items-center mb-2';
        div.innerHTML = `
            <input type="text" class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm exercise-name" placeholder="Exercise Name" value="${name}" required>
            <button type="button" class="remove-exercise-btn ml-2 bg-red-500 text-white px-2 py-1 rounded">X</button>
        `;
        exercisesContainer.appendChild(div);
        div.querySelector('.remove-exercise-btn').addEventListener('click', () => div.remove());
    }

    routineForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUser) {
            alert("You must be logged in to save a routine.");
            return;
        }

        const routineName = routineNameInput.value;
        const exerciseInputs = exercisesContainer.querySelectorAll('.exercise-name');
        const exercises = Array.from(exerciseInputs).map(input => ({ name: input.value }));

        const routineData = {
            name: routineName,
            exercises: exercises,
            user_id: currentUser.id,
        };

        const routineId = routineIdInput.value;
        let error;

        if (routineId) {
            // Update existing routine
            const { error: updateError } = await supabase.from('routines').update(routineData).eq('id', routineId);
            error = updateError;
        } else {
            // Create new routine
            const { error: insertError } = await supabase.from('routines').insert(routineData);
            error = insertError;
        }

        if (error) {
            alert('Error saving routine: ' + error.message);
        } else {
            loadRoutines();
            showSection('routines');
        }
    });

    async function loadRoutines() {
        if (!currentUser) return;

        const { data: routines, error } = await supabase
            .from('routines')
            .select('*')
            .eq('user_id', currentUser.id);

        if (error) {
            alert('Error loading routines: ' + error.message);
            return;
        }

        routinesList.innerHTML = '';
        routines.forEach(routine => {
            const div = document.createElement('div');
            div.className = 'bg-white p-4 rounded shadow';
            div.innerHTML = `
                <h3 class="text-xl font-bold">${routine.name}</h3>
                <div class="mt-4 flex justify-end gap-2">
                    <button class="start-workout-btn bg-blue-500 text-white px-3 py-1 rounded" data-id="${routine.id}" data-name="${routine.name}">Start Workout</button>
                    <button class="edit-routine-btn bg-yellow-500 text-white px-3 py-1 rounded" data-id="${routine.id}">Edit</button>
                    <button class="delete-routine-btn bg-red-500 text-white px-3 py-1 rounded" data-id="${routine.id}">Delete</button>
                </div>
            `;
            routinesList.appendChild(div);
        });
    }

    routinesList.addEventListener('click', async (e) => {
        const target = e.target;
        const routineId = target.dataset.id;

        if (target.classList.contains('edit-routine-btn')) {
            const { data: routine, error } = await supabase.from('routines').select('*').eq('id', routineId).single();
            if (error) {
                alert('Error fetching routine: ' + error.message);
                return;
            }
            routineFormTitle.textContent = 'Edit Routine';
            routineIdInput.value = routine.id;
            routineNameInput.value = routine.name;
            exercisesContainer.innerHTML = '';
            routine.exercises.forEach(ex => addExerciseInput(ex.name));
            showSection('routine-form');
        }

        if (target.classList.contains('delete-routine-btn')) {
            if (confirm('Are you sure you want to delete this routine?')) {
                const { error } = await supabase.from('routines').delete().eq('id', routineId);
                if (error) {
                    alert('Error deleting routine: ' + error.message);
                } else {
                    loadRoutines();
                }
            }
        }

        if (target.classList.contains('start-workout-btn')) {
            startWorkout(routineId, target.dataset.name);
        }
    });


    // --- Workout Tracking --- //
    let currentWorkout = null;

    async function startWorkout(routineId, routineName) {
        const { data: routine, error } = await supabase.from('routines').select('exercises').eq('id', routineId).single();
        if (error) {
            alert("Could not fetch routine details.");
            return;
        }

        currentWorkout = {
            routine_id: routineId,
            routine_name: routineName,
            exercises: routine.exercises.map(ex => ({ name: ex.name, sets: [] }))
        };

        document.getElementById('workout-routine-name').textContent = routineName;
        renderWorkoutExercises();
        showSection('workout');
    }

    function renderWorkoutExercises() {
        workoutExercisesList.innerHTML = '';
        currentWorkout.exercises.forEach((exercise, index) => {
            const div = document.createElement('div');
            div.className = 'bg-white p-4 rounded shadow mb-4';
            div.innerHTML = `
                <h4 class="text-lg font-bold">${exercise.name}</h4>
                <div class="sets-list mt-2">
                    ${exercise.sets.map((set, setIndex) => `
                        <div class="flex items-center justify-between p-2 bg-gray-100 rounded mb-1">
                            <span>Set ${setIndex + 1}: ${set.weight} kg x ${set.reps} reps</span>
                            <div>
                                <button class="edit-set-btn text-sm text-yellow-600" data-ex-index="${index}" data-set-index="${setIndex}">Edit</button>
                                <button class="delete-set-btn text-sm text-red-600 ml-2" data-ex-index="${index}" data-set-index="${setIndex}">Delete</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="add-set-form mt-2 flex gap-2">
                    <input type="number" class="w-1/2 p-2 border rounded" placeholder="Weight (kg)">
                    <input type="number" class="w-1/2 p-2 border rounded" placeholder="Reps">
                    <button class="add-set-btn bg-green-500 text-white px-3 py-1 rounded" data-ex-index="${index}">Add Set</button>
                </div>
            `;
            workoutExercisesList.appendChild(div);
        });
    }

    workoutExercisesList.addEventListener('click', (e) => {
        const target = e.target;
        const exIndex = target.dataset.exIndex;

        if (target.classList.contains('add-set-btn')) {
            const form = target.closest('.add-set-form');
            const weightInput = form.querySelector('input[placeholder="Weight (kg)"]');
            const repsInput = form.querySelector('input[placeholder="Reps"]');
            const weight = parseFloat(weightInput.value);
            const reps = parseInt(repsInput.value);

            if (!isNaN(weight) && !isNaN(reps)) {
                currentWorkout.exercises[exIndex].sets.push({ weight, reps });
                renderWorkoutExercises();
            }
        }

        if (target.classList.contains('delete-set-btn')) {
            const setIndex = target.dataset.setIndex;
            currentWorkout.exercises[exIndex].sets.splice(setIndex, 1);
            renderWorkoutExercises();
        }

        if (target.classList.contains('edit-set-btn')) {
            const setIndex = target.dataset.setIndex;
            const set = currentWorkout.exercises[exIndex].sets[setIndex];
            const newWeight = prompt("Enter new weight:", set.weight);
            const newReps = prompt("Enter new reps:", set.reps);

            if (newWeight !== null && newReps !== null) {
                set.weight = parseFloat(newWeight) || set.weight;
                set.reps = parseInt(newReps) || set.reps;
                renderWorkoutExercises();
            }
        }
    });

    document.getElementById('finish-workout-btn').addEventListener('click', async () => {
        if (!currentUser || !currentWorkout) return;

        const workoutData = {
            user_id: currentUser.id,
            routine_id: currentWorkout.routine_id,
            routine_name: currentWorkout.routine_name,
            date: new Date().toISOString(),
            exercises: currentWorkout.exercises,
        };

        const { error } = await supabase.from('workouts').insert(workoutData);

        if (error) {
            alert('Error saving workout: ' + error.message);
        } else {
            alert('Workout saved successfully!');
            currentWorkout = null;
            showSection('routines');
        }
    });


    // --- Workout History --- //

    async function loadWorkoutHistory() {
        if (!currentUser) return;

        const { data: workouts, error } = await supabase
            .from('workouts')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('date', { ascending: false });

        if (error) {
            alert('Error loading workout history: ' + error.message);
            return;
        }

        historyList.innerHTML = '';
        workouts.forEach(workout => {
            const div = document.createElement('div');
            div.className = 'bg-white p-4 rounded shadow mb-4';
            const workoutDate = new Date(workout.date).toLocaleString();
            div.innerHTML = `
                <div class="flex justify-between items-center">
                    <div>
                        <h3 class="text-xl font-bold">${workout.routine_name}</h3>
                        <p class="text-sm text-gray-500">${workoutDate}</p>
                    </div>
                    <button class="view-workout-details-btn bg-gray-200 px-3 py-1 rounded" data-id="${workout.id}">Details</button>
                </div>
                <div class="workout-details hidden mt-4">
                    ${workout.exercises.map(ex => `
                        <div class="mb-2">
                            <h5 class="font-semibold">${ex.name}</h5>
                            <ul class="list-disc list-inside pl-2">
                                ${ex.sets.map(set => `<li>${set.weight} kg x ${set.reps} reps</li>`).join('')}
                            </ul>
                        </div>
                    `).join('')}
                </div>
            `;
            historyList.appendChild(div);
        });
    }

    historyList.addEventListener('click', (e) => {
        if (e.target.classList.contains('view-workout-details-btn')) {
            const details = e.target.closest('div').nextElementSibling;
            details.classList.toggle('hidden');
        }
    });

    // Initial Load
    checkUser();
});
