import { supabase } from './supabase.js';

document.addEventListener('DOMContentLoaded', () => {
    // Sections
    const authSection = document.getElementById('auth-section');
    const appSection = document.getElementById('app-section');
    const routinesSection = document.getElementById('routines-section');
    const routineFormSection = document.getElementById('routine-form-section');
    const workoutSection = document.getElementById('workout-section');
    const historySection = document.getElementById('history-section');
    const profileSection = document.getElementById('profile-section');

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
    const viewProfileBtn = document.getElementById('view-profile-btn');
    const finishWorkoutBtn = document.getElementById('finish-workout-btn');

    // Form Elements
    const routineForm = document.getElementById('routine-form');
    const routineFormTitle = document.getElementById('routine-form-title');
    const routineIdInput = document.getElementById('routine-id');
    const routineNameInput = document.getElementById('routine-name');
    const exercisesContainer = document.getElementById('exercises-container');

    // Profile Form Elements
    const profileForm = document.getElementById('profile-form');
    const heightInput = document.getElementById('height');
    const bodyWeightInput = document.getElementById('body-weight');
    const cancelProfileBtn = document.getElementById('cancel-profile-btn');

    // Unit Toggle
    const unitToggle = document.getElementById('unit-toggle');

    // Lists
    const routinesList = document.getElementById('routines-list');
    const workoutExercisesList = document.getElementById('workout-exercises-list');
    const historyList = document.getElementById('history-list');

    // Dashboard Elements
    const dashboardSection = document.getElementById('dashboard-section');
    const workoutsThisWeekEl = document.getElementById('workouts-this-week');
    const oneRepMaxExerciseNames = document.querySelectorAll('.one-rep-max-exercise-name');
    const oneRepMaxValues = document.querySelectorAll('.one-rep-max-value');
    const oneRepMaxUnitEl = document.getElementById('one-rep-max-unit');
    const weeklyVolumeChartCanvas = document.getElementById('weekly-volume-chart');

    let currentUser = null;
    let weightUnit = 'kg'; // 'kg' or 'lbs'

    // --- Authentication --- //

    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            currentUser = session.user;
            authSection.classList.add('hidden');
            appSection.classList.remove('hidden');
            loadUserProfile();
            loadDashboardData();
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
        profileSection.classList.add('hidden');

        const sectionMap = {
            'routines': routinesSection,
            'routine-form': routineFormSection,
            'workout': workoutSection,
            'history': historySection,
            'profile': profileSection,
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

    viewProfileBtn.addEventListener('click', () => {
        openProfilePage();
        showSection('profile');
    });

    unitToggle.addEventListener('change', async () => {
        weightUnit = unitToggle.checked ? 'lbs' : 'kg';
        if (currentUser) {
            await supabase.from('profiles').upsert({ user_id: currentUser.id, weight_unit: weightUnit }, { onConflict: 'user_id' });
        }
        // Re-render any views that display weight
        if (routinesSection.classList.contains('hidden') === false) {
            loadRoutines();
        } else if (workoutSection.classList.contains('hidden') === false) {
            renderWorkoutExercises();
        } else if (historySection.classList.contains('hidden') === false) {
            loadWorkoutHistory();
        }
    });


    // --- Routine Management --- //

    addExerciseBtn.addEventListener('click', () => addExerciseInput());

    function addExerciseInput(name = '', sets = 3) {
        const div = document.createElement('div');
        div.className = 'flex items-center mb-2 gap-2 exercise-row';
        div.innerHTML = `
            <input type="text" class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm exercise-name" placeholder="Exercise Name" value="${name}" required>
            <input type="number" class="mt-1 block w-20 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm exercise-sets" placeholder="Sets" value="${sets}" min="1" required>
            <div class="flex items-center">
                <input type="checkbox" class="mr-2 exercise-bodyweight">
                <label class="text-sm">Bodyweight</label>
            </div>
            <button type="button" class="remove-exercise-btn bg-red-500 text-white px-2 py-1 rounded w-8">X</button>
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
        const exerciseInputs = exercisesContainer.querySelectorAll('.exercise-row');
        const exercises = Array.from(exerciseInputs).map(div => {
            const name = div.querySelector('.exercise-name').value;
            const sets = parseInt(div.querySelector('.exercise-sets').value, 10);
            const bodyweight = div.querySelector('.exercise-bodyweight').checked;
            return { name, sets, bodyweight };
        });

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
            routine.exercises.forEach(ex => {
                addExerciseInput(ex.name, ex.sets);
                const newExerciseRow = exercisesContainer.lastElementChild;
                newExerciseRow.querySelector('.exercise-bodyweight').checked = ex.bodyweight || false;
            });
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

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('body_weight, weight_unit')
            .eq('user_id', currentUser.id)
            .single();

        if (profile && profile.weight_unit) {
            weightUnit = profile.weight_unit;
            unitToggle.checked = weightUnit === 'lbs';
        }

        currentWorkout = {
            routine_id: routineId,
            routine_name: routineName,
            body_weight: profile ? profile.body_weight : 0,
            exercises: routine.exercises.map(ex => ({
                name: ex.name,
                bodyweight: ex.bodyweight,
                sets: Array.from({ length: ex.sets }, () => ({ 
                    weight: ex.bodyweight ? convertWeight(profile ? profile.body_weight : 0, weightUnit) : '', 
                    reps: '', 
                }))
            }))
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
                <h4 class="text-lg font-bold">${exercise.name} ${exercise.bodyweight ? '(Bodyweight)' : ''}</h4>
                <div class="sets-list mt-2">
                    ${exercise.sets.map((set, setIndex) => `
                        <div class="flex items-center justify-between p-2 bg-gray-100 rounded mb-1">
                            <span>Set ${setIndex + 1}:</span>
                            <input type="number" class="w-20 p-1 border rounded set-weight" placeholder="Weight" value="${set.weight}" data-ex-index="${index}" data-set-index="${setIndex}">
                            <span class="ml-2">${weightUnit}</span>
                            <input type="number" class="w-20 p-1 border rounded set-reps" placeholder="Reps" value="${set.reps}" data-ex-index="${index}" data-set-index="${setIndex}">
                            <button class="delete-set-btn text-sm text-red-600" data-ex-index="${index}" data-set-index="${setIndex}">Delete</button>
                        </div>
                    `).join('')}
                </div>
                <button class="add-set-btn mt-2 bg-green-500 text-white px-3 py-1 rounded" data-ex-index="${index}">Add Set</button>
            `;
            workoutExercisesList.appendChild(div);
        });
    }

    workoutExercisesList.addEventListener('input', (e) => {
        const target = e.target;
        const exIndex = target.dataset.exIndex;
        const setIndex = target.dataset.setIndex;

        if (target.classList.contains('set-weight')) {
            let weight = target.value;
            currentWorkout.exercises[exIndex].sets[setIndex].weight = weight;
        }

        if (target.classList.contains('set-reps')) {
            currentWorkout.exercises[exIndex].sets[setIndex].reps = target.value;
        }
    });

    workoutExercisesList.addEventListener('click', (e) => {
        const target = e.target;
        const exIndex = target.dataset.exIndex;

        if (target.classList.contains('add-set-btn')) {
            currentWorkout.exercises[exIndex].sets.push({ weight: '', reps: '', bodyweight: false });
            renderWorkoutExercises();
        }

        if (target.classList.contains('delete-set-btn')) {
            const setIndex = target.dataset.setIndex;
            currentWorkout.exercises[exIndex].sets.splice(setIndex, 1);
            renderWorkoutExercises();
        }
    });

    finishWorkoutBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to complete this workout?')) {
            finishWorkout();
        }
    });


    async function finishWorkout() {
        if (!currentWorkout) return;

        const workoutData = {
            user_id: currentUser.id,
            routine_id: currentWorkout.routine_id,
            routine_name: currentWorkout.routine_name,
            exercises: currentWorkout.exercises.map(ex => ({
                ...ex,
                sets: ex.sets.map(set => {
                    let weightInKg = set.weight;
                    if (weightUnit === 'lbs') {
                        weightInKg = lbsToKg(set.weight);
                    }
                    return { ...set, weight: weightInKg };
                })
            })),
            date: new Date().toISOString(),
        };

        const { error } = await supabase.from('workouts').insert(workoutData);

        if (error) {
            alert('Error saving workout: ' + error.message);
        } else {
            alert('Workout saved successfully!');
            currentWorkout = null;
            loadDashboardData();
            showSection('routines');
        }
    }


    // --- Dashboard --- //

    const exerciseModal = document.getElementById('exercise-modal');
    const exerciseSelectForm = document.getElementById('exercise-select-form');
    const modalExercisesContainer = document.getElementById('modal-exercises-container');
    const cancelExerciseSelectBtn = document.getElementById('cancel-exercise-select');
    const editDashboardExercisesBtn = document.getElementById('edit-dashboard-exercises');

    editDashboardExercisesBtn.addEventListener('click', async () => {
        const { data: workouts } = await supabase.from('workouts').select('exercises').eq('user_id', currentUser.id);
        const allExercises = [...new Set(workouts.flatMap(w => w.exercises.map(e => e.name)))];
        
        const { data: profile } = await supabase.from('profiles').select('dashboard_exercises').eq('user_id', currentUser.id).single();
        const savedExercises = profile.dashboard_exercises || [];

        modalExercisesContainer.innerHTML = '';
        allExercises.forEach(ex => {
            const isChecked = savedExercises.includes(ex);
            modalExercisesContainer.innerHTML += `
                <div>
                    <input type="checkbox" id="ex-${ex}" value="${ex}" class="mr-2" ${isChecked ? 'checked' : ''}>
                    <label for="ex-${ex}">${ex}</label>
                </div>
            `;
        });
        exerciseModal.classList.remove('hidden');
    });

    cancelExerciseSelectBtn.addEventListener('click', () => {
        exerciseModal.classList.add('hidden');
    });

    exerciseSelectForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const selectedExercises = Array.from(modalExercisesContainer.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
        if (selectedExercises.length > 3) {
            alert('You can only select up to 3 exercises for the dashboard.');
            return;
        }

        await supabase.from('profiles').upsert({ user_id: currentUser.id, dashboard_exercises: selectedExercises }, { onConflict: 'user_id' });
        exerciseModal.classList.add('hidden');
        loadDashboardData();
    });

    async function loadDashboardData() {
        if (!currentUser) return;

        const { data: workouts, error } = await supabase
            .from('workouts')
            .select('date, exercises')
            .eq('user_id', currentUser.id)
            .order('date', { ascending: false });

        if (error) {
            console.error('Error loading workout data for dashboard:', error);
            return;
        }

        // Workouts This Week
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const workoutsThisWeek = workouts.filter(w => new Date(w.date) > oneWeekAgo).length;
        workoutsThisWeekEl.textContent = workoutsThisWeek;

        oneRepMaxUnitEl.textContent = weightUnit;

        // 1 Rep Max
        const { data: profile } = await supabase.from('profiles').select('dashboard_exercises').eq('user_id', currentUser.id).single();
        const savedExercises = profile.dashboard_exercises || [];
        
        oneRepMaxExerciseNames.forEach((nameEl, i) => {
            const exerciseName = savedExercises[i];
            if (exerciseName) {
                nameEl.textContent = exerciseName;
                calculateAndDisplayOneRepMax(exerciseName, i, workouts);
            } else {
                nameEl.textContent = 'Select Exercise';
                oneRepMaxValues[i].textContent = '-';
            }
        });

        // Weekly Volume Chart
        renderWeeklyVolumeChart(workouts);
    }

    

    function calculateAndDisplayOneRepMax(exerciseName, cardIndex, workouts) {
        if (!exerciseName) {
            oneRepMaxValues[cardIndex].textContent = '-';
            return;
        }

        let max1RM = 0;
        workouts.forEach(workout => {
            workout.exercises.forEach(ex => {
                if (ex.name === exerciseName) {
                    ex.sets.forEach(set => {
                        if (set.weight && set.reps) {
                            const oneRM = set.weight * (1 + set.reps / 30); // Epley formula
                            if (oneRM > max1RM) {
                                max1RM = oneRM;
                            }
                        }
                    });
                }
            });
        });

        oneRepMaxValues[cardIndex].textContent = max1RM > 0 ? `${max1RM.toFixed(1)}` : '-';
    }

    function renderWeeklyVolumeChart(workouts) {
        const weeklyData = {};
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - (i * 7));
            const weekStart = d.toISOString().split('T')[0];
            weeklyData[weekStart] = 0;
        }

        workouts.forEach(workout => {
            const workoutDate = new Date(workout.date);
            const weekStart = Object.keys(weeklyData).reverse().find(ws => workoutDate >= new Date(ws));
            if (weekStart) {
                const volume = workout.exercises.reduce((total, ex) => {
                    return total + ex.sets.reduce((setTotal, set) => {
                        return setTotal + (set.weight * set.reps || 0);
                    }, 0);
                }, 0);
                weeklyData[weekStart] += volume;
            }
        });

        const labels = Object.keys(weeklyData).map(ws => new Date(ws).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        const dataInTons = Object.values(weeklyData).map(kg => kg / 1000);

        new Chart(weeklyVolumeChartCanvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `Weekly Volume (tons)`,
                    data: dataInTons,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            display: false
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }


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
                    <div class="flex items-center gap-2">
                        <button class="view-workout-details-btn bg-gray-200 px-3 py-1 rounded" data-id="${workout.id}">Details</button>
                        <button class="delete-workout-btn bg-red-500 text-white px-3 py-1 rounded" data-id="${workout.id}">Delete</button>
                    </div>
                </div>
                <div class="workout-details hidden mt-4">
                    ${workout.exercises.map(ex => `
                        <div class="mb-2">
                            <h5 class="font-semibold">${ex.name}</h5>
                            <ul class="list-disc list-inside pl-2">
                                ${ex.sets.map(set => `<li>${set.bodyweight ? 'Bodyweight' : `${convertWeight(set.weight, weightUnit)} ${weightUnit}`} x ${set.reps} reps</li>`).join('')}
                            </ul>
                        </div>
                    `).join('')}
                </div>
            `;
            historyList.appendChild(div);
        });
    }

    async function deleteWorkout(workoutId) {
        const { error } = await supabase.from('workouts').delete().eq('id', workoutId);
        if (error) {
            alert('Error deleting workout: ' + error.message);
        } else {
            loadWorkoutHistory();
        }
    }

    historyList.addEventListener('click', (e) => {
        const target = e.target;
        if (target.classList.contains('view-workout-details-btn')) {
            const details = target.closest('.bg-white').querySelector('.workout-details');
            if (details) {
                details.classList.toggle('hidden');
            }
        }

        if (target.classList.contains('delete-workout-btn')) {
            const workoutId = target.dataset.id;
            if (confirm('Are you sure you want to delete this workout?')) {
                deleteWorkout(workoutId);
            }
        }
    });

    // --- Utility Functions ---
    const kgToLbs = (kg) => (kg * 2.20462).toFixed(2);
    const lbsToKg = (lbs) => (lbs / 2.20462).toFixed(2);

    function convertWeight(weight, toUnit) {
        if (weight === null || weight === '' || isNaN(weight)) return '';
        const currentUnit = weightUnit;
        if (currentUnit === toUnit) return weight;

        if (toUnit === 'lbs') {
            return kgToLbs(weight);
        } else {
            return lbsToKg(weight);
        }
    }


    // --- Profile Management ---

    cancelProfileBtn.addEventListener('click', () => showSection('routines'));

    async function loadUserProfile() {
        if (!currentUser) return;

        const { data: profile, error } = await supabase
            .from('profiles')
            .select('weight_unit')
            .eq('user_id', currentUser.id)
            .single();

        if (profile && profile.weight_unit) {
            weightUnit = profile.weight_unit;
        } else {
            weightUnit = 'kg'; // default
        }
        unitToggle.checked = weightUnit === 'lbs';
    }

    async function openProfilePage() {
        if (!currentUser) return;

        const { data: profile, error } = await supabase
            .from('profiles')
            .select('height, body_weight')
            .eq('user_id', currentUser.id)
            .single();

        if (profile) {
            heightInput.value = profile.height || '';
            const displayWeight = convertWeight(profile.body_weight, weightUnit);
            bodyWeightInput.value = displayWeight || '';
        }
    }

    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUser) return;

        let bodyWeightKg = bodyWeightInput.value;
        if (weightUnit === 'lbs') {
            bodyWeightKg = lbsToKg(bodyWeightInput.value);
        }

        const profileData = {
            user_id: currentUser.id,
            height: heightInput.value,
            body_weight: bodyWeightKg,
            weight_unit: weightUnit,
            updated_at: new Date().toISOString(),
        };

        const { error } = await supabase.from('profiles').upsert(profileData, { onConflict: 'user_id' });

        if (error) {
            alert('Error saving profile: ' + error.message);
        } else {
            alert('Profile saved successfully!');
            showSection('routines');
        }
    });

    // Initial Load
    checkUser();
});