import { supabase } from './supabase.js';

document.addEventListener('DOMContentLoaded', () => {
    // Sections
    const authSection = document.getElementById('auth-section');
    const appSection = document.getElementById('app-section');
    const dashboardSection = document.getElementById('dashboard-section');
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
    const backToDashboardFromRoutinesBtn = document.getElementById('back-to-dashboard-from-routines-btn');
    const backToDashboardFromHistoryBtn = document.getElementById('back-to-dashboard-from-history-btn');
    const cancelWorkoutBtn = document.getElementById('cancel-workout-btn');
    const viewHistoryBtn = document.getElementById('view-history-btn');
    const viewProfileBtn = document.getElementById('view-profile-btn');
    const viewRoutinesBtn = document.getElementById('view-routines-btn');
    const finishWorkoutBtn = document.getElementById('finish-workout-btn');
    const copyPreviousWorkoutBtn = document.getElementById('copy-previous-workout-btn');

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
    const unitToggleContainer = document.getElementById('unit-toggle-container');

    // Lists
    const routinesList = document.getElementById('routines-list');
    const workoutExercisesList = document.getElementById('workout-exercises-list');
    const historyList = document.getElementById('history-list');

    // Dashboard Elements
    const workoutsThisWeekEl = document.getElementById('workouts-this-week');
    const oneRepMaxExerciseNames = document.querySelectorAll('.one-rep-max-exercise-name');
    const oneRepMaxValues = document.querySelectorAll('.one-rep-max-value');
    const oneRepMaxUnitEl = document.getElementById('one-rep-max-unit');
    const weeklyVolumeChartCanvas = document.getElementById('weekly-volume-chart');
    const progressExerciseSelect = document.getElementById('progress-exercise-select');
    const progressChartCanvas = document.getElementById('progress-chart');

    // Timer Elements
    const workoutTimerEl = document.getElementById('workout-timer');
    const restTimerBar = document.getElementById('rest-timer-bar');
    const restTimerPresets = document.getElementById('rest-timer-presets');
    const restTimerCountdown = document.getElementById('rest-timer-countdown');
    const restTimerDisplay = document.getElementById('rest-timer-display');
    const restTimerPauseBtn = document.getElementById('rest-timer-pause');
    const restTimerResetBtn = document.getElementById('rest-timer-reset');
    const restCustomBtn = document.getElementById('rest-custom-btn');

    let currentUser = null;
    let weightUnit = 'kg';
    let progressChart = null;
    let weeklyVolumeChart = null;

    // Workout timer state
    let workoutStartTime = null;
    let workoutTimerInterval = null;

    // Rest timer state
    let restTimerInterval = null;
    let restTimeRemaining = 0;
    let restTimerPaused = false;

    // Stopwatch state for timed exercises
    const stopwatchIntervals = {};
    const stopwatchStartTimes = {};

    // Exercise type definitions
    const EXERCISE_TYPES = {
        weighted: { label: 'Weighted', fields: ['weight', 'reps'] },
        bodyweight: { label: 'Bodyweight', fields: ['reps'] },
        timed: { label: 'Timed', fields: ['duration'] },
        timed_weighted: { label: 'Timed + Weight', fields: ['weight', 'duration'] },
        cardio: { label: 'Cardio', fields: ['duration', 'distance'] },
        reps_only: { label: 'Reps Only', fields: ['reps'] },
    };

    // --- Dark Mode --- //

    function initDarkMode() {
        const saved = localStorage.getItem('theme');
        if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        }
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                document.documentElement.classList.toggle('dark', e.matches);
            }
        });
        updateThemeIcon();
    }

    function updateThemeIcon() {
        const saved = localStorage.getItem('theme');
        document.getElementById('theme-icon-sun').classList.add('hidden');
        document.getElementById('theme-icon-moon').classList.add('hidden');
        document.getElementById('theme-icon-system').classList.add('hidden');

        if (saved === 'light') {
            document.getElementById('theme-icon-sun').classList.remove('hidden');
        } else if (saved === 'dark') {
            document.getElementById('theme-icon-moon').classList.remove('hidden');
        } else {
            document.getElementById('theme-icon-system').classList.remove('hidden');
        }
    }

    document.getElementById('dark-mode-toggle').addEventListener('click', () => {
        const saved = localStorage.getItem('theme');
        if (!saved) {
            // System -> Dark
            localStorage.setItem('theme', 'dark');
            document.documentElement.classList.add('dark');
        } else if (saved === 'dark') {
            // Dark -> Light
            localStorage.setItem('theme', 'light');
            document.documentElement.classList.remove('dark');
        } else {
            // Light -> System
            localStorage.removeItem('theme');
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.classList.toggle('dark', prefersDark);
        }
        updateThemeIcon();
        // Re-render charts if visible
        if (!dashboardSection.classList.contains('hidden')) {
            loadDashboardData();
        }
    });

    function isDarkMode() {
        return document.documentElement.classList.contains('dark');
    }

    function getChartColors() {
        if (isDarkMode()) {
            return {
                gridColor: 'rgba(255, 255, 255, 0.1)',
                tickColor: 'rgba(255, 255, 255, 0.7)',
                legendColor: 'rgba(255, 255, 255, 0.8)',
            };
        }
        return {
            gridColor: 'rgba(0, 0, 0, 0.1)',
            tickColor: 'rgba(0, 0, 0, 0.7)',
            legendColor: 'rgba(0, 0, 0, 0.8)',
        };
    }

    initDarkMode();

    // --- Authentication --- //

    const forgotPasswordSection = document.getElementById('forgot-password-section');
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    const forgotPasswordMessage = document.getElementById('forgot-password-message');
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    const backToLoginLink = document.getElementById('back-to-login-link');
    const resetPasswordSection = document.getElementById('reset-password-section');
    const resetPasswordForm = document.getElementById('reset-password-form');
    const resetPasswordMessage = document.getElementById('reset-password-message');

    function showAuthView(view) {
        authSection.classList.add('hidden');
        forgotPasswordSection.classList.add('hidden');
        resetPasswordSection.classList.add('hidden');
        appSection.classList.add('hidden');
        if (view === 'login') authSection.classList.remove('hidden');
        else if (view === 'forgot') forgotPasswordSection.classList.remove('hidden');
        else if (view === 'reset') resetPasswordSection.classList.remove('hidden');
    }

    let isPasswordRecovery = false;

    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (isPasswordRecovery) {
            // Don't navigate away from reset form
            return;
        }
        if (session) {
            currentUser = session.user;
            authSection.classList.add('hidden');
            forgotPasswordSection.classList.add('hidden');
            resetPasswordSection.classList.add('hidden');
            appSection.classList.remove('hidden');
            unitToggleContainer.classList.remove('hidden');
            loadDashboardData();
            loadRoutines();
            showSection('dashboard');
        } else {
            currentUser = null;
            appSection.classList.add('hidden');
            unitToggleContainer.classList.add('hidden');
            showAuthView('login');
        }
    };

    // Listen for PASSWORD_RECOVERY event to show the new password form
    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
            isPasswordRecovery = true;
            showAuthView('reset');
        }
    });

    authSwitchLink.addEventListener('click', (e) => {
        e.preventDefault();
        isLogin = !isLogin;
        authTitle.textContent = isLogin ? 'Login' : 'Sign Up';
        authForm.querySelector('button[type="submit"]').textContent = isLogin ? 'Login' : 'Sign Up';
        authSwitchLink.textContent = isLogin ? 'Need an account? Sign Up' : 'Have an account? Login';
        authMessage.textContent = '';
        authForm.reset();
    });

    forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        showAuthView('forgot');
    });

    backToLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        showAuthView('login');
    });

    forgotPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('reset-email').value;
        forgotPasswordMessage.textContent = 'Sending...';
        forgotPasswordMessage.className = 'text-sm mt-4 text-center text-gray-500';

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin,
        });

        if (error) {
            forgotPasswordMessage.textContent = error.message;
            forgotPasswordMessage.className = 'text-sm mt-4 text-center text-red-500';
        } else {
            forgotPasswordMessage.textContent = 'Check your email for the reset link!';
            forgotPasswordMessage.className = 'text-sm mt-4 text-center text-green-500';
        }
    });

    resetPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (newPassword !== confirmPassword) {
            resetPasswordMessage.textContent = 'Passwords do not match.';
            resetPasswordMessage.className = 'text-sm mt-4 text-center text-red-500';
            return;
        }

        const { error } = await supabase.auth.updateUser({ password: newPassword });

        if (error) {
            resetPasswordMessage.textContent = error.message;
            resetPasswordMessage.className = 'text-sm mt-4 text-center text-red-500';
        } else {
            alert('Password updated successfully!');
            resetPasswordMessage.textContent = '';
            isPasswordRecovery = false;
            checkUser();
        }
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
        dashboardSection.classList.add('hidden');
        routinesSection.classList.add('hidden');
        routineFormSection.classList.add('hidden');
        workoutSection.classList.add('hidden');
        historySection.classList.add('hidden');
        profileSection.classList.add('hidden');

        const sectionMap = {
            'dashboard': dashboardSection,
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
    cancelWorkoutBtn.addEventListener('click', () => {
        clearWorkoutTimer();
        clearRestTimer();
        showSection('routines');
    });
    backToDashboardFromRoutinesBtn.addEventListener('click', () => showSection('dashboard'));
    backToDashboardFromHistoryBtn.addEventListener('click', () => showSection('dashboard'));
    viewHistoryBtn.addEventListener('click', () => {
        loadWorkoutHistory();
        showSection('history');
    });

    viewProfileBtn.addEventListener('click', () => {
        openProfilePage();
        showSection('profile');
    });

    viewRoutinesBtn.addEventListener('click', () => {
        showSection('routines');
    });

    unitToggle.addEventListener('change', async () => {
        weightUnit = unitToggle.checked ? 'lbs' : 'kg';
        if (currentUser) {
            await supabase.from('profiles').upsert({ user_id: currentUser.id, weight_unit: weightUnit }, { onConflict: 'user_id' });
        }
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

    function addExerciseInput(name = '', sets = 3, type = 'weighted') {
        const div = document.createElement('div');
        div.className = 'flex items-center mb-2 gap-2 exercise-row';
        const typeOptions = Object.entries(EXERCISE_TYPES).map(([key, val]) =>
            `<option value="${key}" ${key === type ? 'selected' : ''}>${val.label}</option>`
        ).join('');
        div.innerHTML = `
            <input type="text" class="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:text-white exercise-name" placeholder="Exercise Name" value="${name}" required>
            <input type="number" class="mt-1 block w-20 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:text-white exercise-sets" placeholder="Sets" value="${sets}" min="1" required>
            <select class="mt-1 block w-32 px-2 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:text-white exercise-type">${typeOptions}</select>
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
            const type = div.querySelector('.exercise-type').value;
            return { name, sets, type };
        });

        const routineData = {
            name: routineName,
            exercises: exercises,
            user_id: currentUser.id,
        };

        const routineId = routineIdInput.value;
        let error;

        if (routineId) {
            const { error: updateError } = await supabase.from('routines').update(routineData).eq('id', routineId);
            error = updateError;
        } else {
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
            div.className = 'bg-white dark:bg-gray-800 p-4 rounded shadow';
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

    // Helper to resolve exercise type from routine data (backward compat)
    function resolveExerciseType(ex) {
        if (ex.type) return ex.type;
        if (ex.bodyweight) return 'bodyweight';
        return 'weighted';
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
                addExerciseInput(ex.name, ex.sets, resolveExerciseType(ex));
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

    function createEmptySet(type) {
        switch (type) {
            case 'bodyweight': return { reps: '' };
            case 'timed': return { duration: 0 };
            case 'timed_weighted': return { weight: '', duration: 0 };
            case 'cardio': return { duration: 0, distance: '' };
            case 'reps_only': return { reps: '' };
            case 'weighted':
            default:
                return { weight: '', reps: '' };
        }
    }

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
            exercises: routine.exercises.map(ex => {
                const type = resolveExerciseType(ex);
                return {
                    name: ex.name,
                    type: type,
                    sets: Array.from({ length: ex.sets }, () => {
                        const set = createEmptySet(type);
                        if (type === 'weighted' && ex.bodyweight) {
                            set.weight = convertWeight(profile ? profile.body_weight : 0, 'kg');
                        }
                        return set;
                    })
                };
            })
        };

        document.getElementById('workout-routine-name').textContent = routineName;
        renderWorkoutExercises();
        showSection('workout');
        startWorkoutTimer();
    }

    function formatDuration(seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    function formatDurationLong(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    function renderWorkoutExercises() {
        workoutExercisesList.innerHTML = '';
        currentWorkout.exercises.forEach((exercise, index) => {
            const type = exercise.type || 'weighted';
            const typeLabel = EXERCISE_TYPES[type]?.label || 'Weighted';
            const div = document.createElement('div');
            div.className = 'bg-white dark:bg-gray-800 p-4 rounded shadow mb-4';

            let setsHtml = '';
            exercise.sets.forEach((set, setIndex) => {
                const key = `${index}-${setIndex}`;
                setsHtml += `<div class="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded mb-1 gap-2 flex-wrap">`;
                setsHtml += `<span class="text-sm font-medium">Set ${setIndex + 1}:</span>`;

                if (type === 'weighted' || type === 'timed_weighted') {
                    setsHtml += `<input type="number" class="w-20 p-1 border dark:border-gray-600 rounded bg-white dark:bg-gray-600 dark:text-white set-weight" placeholder="Weight" value="${set.weight}" data-ex-index="${index}" data-set-index="${setIndex}">`;
                    setsHtml += `<span class="text-sm">${weightUnit}</span>`;
                }

                if (type === 'weighted' || type === 'bodyweight' || type === 'reps_only') {
                    setsHtml += `<input type="number" class="w-20 p-1 border dark:border-gray-600 rounded bg-white dark:bg-gray-600 dark:text-white set-reps" placeholder="Reps" value="${set.reps}" data-ex-index="${index}" data-set-index="${setIndex}">`;
                }

                if (type === 'timed' || type === 'timed_weighted' || type === 'cardio') {
                    const isRunning = !!stopwatchIntervals[key];
                    setsHtml += `<span class="stopwatch-display font-mono text-sm" data-key="${key}">${formatDuration(set.duration || 0)}</span>`;
                    setsHtml += `<button class="stopwatch-btn ${isRunning ? 'bg-red-500' : 'bg-blue-500'} text-white px-2 py-1 rounded text-xs" data-ex-index="${index}" data-set-index="${setIndex}" data-key="${key}">${isRunning ? 'Stop' : 'Start'}</button>`;
                }

                if (type === 'cardio') {
                    const distUnit = weightUnit === 'lbs' ? 'mi' : 'km';
                    setsHtml += `<input type="number" step="0.1" class="w-20 p-1 border dark:border-gray-600 rounded bg-white dark:bg-gray-600 dark:text-white set-distance" placeholder="${distUnit}" value="${set.distance}" data-ex-index="${index}" data-set-index="${setIndex}">`;
                    setsHtml += `<span class="text-sm">${distUnit}</span>`;
                }

                setsHtml += `<button class="delete-set-btn text-sm text-red-600 dark:text-red-400" data-ex-index="${index}" data-set-index="${setIndex}">Delete</button>`;
                setsHtml += `</div>`;
            });

            div.innerHTML = `
                <h4 class="text-lg font-bold">${exercise.name} <span class="text-sm font-normal text-gray-500 dark:text-gray-400">(${typeLabel})</span></h4>
                <div class="sets-list mt-2">${setsHtml}</div>
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
            currentWorkout.exercises[exIndex].sets[setIndex].weight = target.value;
        }
        if (target.classList.contains('set-reps')) {
            currentWorkout.exercises[exIndex].sets[setIndex].reps = target.value;
        }
        if (target.classList.contains('set-distance')) {
            currentWorkout.exercises[exIndex].sets[setIndex].distance = target.value;
        }
    });

    workoutExercisesList.addEventListener('click', (e) => {
        const target = e.target;
        const exIndex = target.dataset.exIndex;

        if (target.classList.contains('add-set-btn')) {
            const type = currentWorkout.exercises[exIndex].type || 'weighted';
            currentWorkout.exercises[exIndex].sets.push(createEmptySet(type));
            renderWorkoutExercises();
        }

        if (target.classList.contains('delete-set-btn')) {
            const setIndex = target.dataset.setIndex;
            const key = `${exIndex}-${setIndex}`;
            if (stopwatchIntervals[key]) {
                clearInterval(stopwatchIntervals[key]);
                delete stopwatchIntervals[key];
                delete stopwatchStartTimes[key];
            }
            currentWorkout.exercises[exIndex].sets.splice(setIndex, 1);
            renderWorkoutExercises();
        }

        if (target.classList.contains('stopwatch-btn')) {
            const key = target.dataset.key;
            const setIndex = target.dataset.setIndex;

            if (stopwatchIntervals[key]) {
                // Stop
                clearInterval(stopwatchIntervals[key]);
                const elapsed = Math.floor((Date.now() - stopwatchStartTimes[key]) / 1000);
                currentWorkout.exercises[exIndex].sets[setIndex].duration =
                    (currentWorkout.exercises[exIndex].sets[setIndex].duration || 0) + elapsed;
                delete stopwatchIntervals[key];
                delete stopwatchStartTimes[key];
                renderWorkoutExercises();
            } else {
                // Start
                stopwatchStartTimes[key] = Date.now();
                const baseDuration = currentWorkout.exercises[exIndex].sets[setIndex].duration || 0;
                stopwatchIntervals[key] = setInterval(() => {
                    const elapsed = Math.floor((Date.now() - stopwatchStartTimes[key]) / 1000);
                    const display = document.querySelector(`.stopwatch-display[data-key="${key}"]`);
                    if (display) {
                        display.textContent = formatDuration(baseDuration + elapsed);
                    }
                }, 250);
                target.textContent = 'Stop';
                target.classList.remove('bg-blue-500');
                target.classList.add('bg-red-500');
            }
        }
    });

    finishWorkoutBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to complete this workout?')) {
            finishWorkout();
        }
    });

    copyPreviousWorkoutBtn.addEventListener('click', () => {
        copyPreviousWorkout();
    });


    async function finishWorkout() {
        if (!currentWorkout) return;

        // Stop all stopwatches
        Object.keys(stopwatchIntervals).forEach(key => {
            clearInterval(stopwatchIntervals[key]);
            const [exIdx, setIdx] = key.split('-');
            if (currentWorkout.exercises[exIdx] && currentWorkout.exercises[exIdx].sets[setIdx] && stopwatchStartTimes[key]) {
                const elapsed = Math.floor((Date.now() - stopwatchStartTimes[key]) / 1000);
                currentWorkout.exercises[exIdx].sets[setIdx].duration =
                    (currentWorkout.exercises[exIdx].sets[setIdx].duration || 0) + elapsed;
            }
            delete stopwatchIntervals[key];
            delete stopwatchStartTimes[key];
        });

        const elapsedSeconds = workoutStartTime ? Math.floor((Date.now() - workoutStartTime) / 1000) : 0;

        const workoutData = {
            user_id: currentUser.id,
            routine_id: currentWorkout.routine_id,
            routine_name: currentWorkout.routine_name,
            exercises: currentWorkout.exercises.map(ex => {
                const type = ex.type || 'weighted';
                const hasWeight = ['weighted', 'timed_weighted'].includes(type);
                return {
                    ...ex,
                    sets: ex.sets.map(set => {
                        const newSet = { ...set };
                        if (hasWeight) {
                            if (set.weight === '' || set.weight === null || isNaN(set.weight)) {
                                newSet.weight = null;
                            } else if (weightUnit === 'lbs') {
                                newSet.weight = lbsToKg(parseFloat(set.weight));
                            } else {
                                newSet.weight = parseFloat(set.weight);
                            }
                        }
                        if (set.distance !== undefined && set.distance !== '') {
                            newSet.distance = parseFloat(set.distance);
                        }
                        if (set.reps !== undefined && set.reps !== '') {
                            newSet.reps = parseInt(set.reps, 10);
                        }
                        return newSet;
                    })
                };
            }),
            date: new Date().toISOString(),
        };

        const { error } = await supabase.from('workouts').insert(workoutData);

        if (error) {
            alert('Error saving workout: ' + error.message);
        } else {
            const durationStr = formatDurationLong(elapsedSeconds);
            alert(`Workout saved successfully!\nDuration: ${durationStr}`);
            currentWorkout = null;
            clearWorkoutTimer();
            clearRestTimer();
            loadDashboardData();
            showSection('dashboard');
        }
    }

    async function copyPreviousWorkout() {
        if (!currentWorkout) return;

        const { data: lastWorkout, error } = await supabase
            .from('workouts')
            .select('exercises')
            .eq('user_id', currentUser.id)
            .eq('routine_id', currentWorkout.routine_id)
            .order('date', { ascending: false })
            .limit(1)
            .single();

        if (error || !lastWorkout) {
            alert('No previous workout found for this routine.');
            return;
        }

        currentWorkout.exercises.forEach((exercise, exIndex) => {
            const lastExercise = lastWorkout.exercises.find(ex => ex.name === exercise.name);
            if (lastExercise) {
                exercise.sets.forEach((set, setIndex) => {
                    if (lastExercise.sets[setIndex]) {
                        const prev = lastExercise.sets[setIndex];
                        if (prev.weight !== undefined && prev.weight !== null) {
                            set.weight = convertWeight(prev.weight, weightUnit);
                        }
                        if (prev.reps !== undefined) set.reps = prev.reps;
                        if (prev.duration !== undefined) set.duration = prev.duration;
                        if (prev.distance !== undefined) set.distance = prev.distance;
                    }
                });
            }
        });

        renderWorkoutExercises();
    }


    // --- Workout Timer --- //

    function startWorkoutTimer() {
        workoutStartTime = Date.now();
        workoutTimerEl.textContent = '00:00:00';
        workoutTimerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - workoutStartTime) / 1000);
            workoutTimerEl.textContent = formatDurationLong(elapsed);
        }, 1000);
    }

    function clearWorkoutTimer() {
        if (workoutTimerInterval) {
            clearInterval(workoutTimerInterval);
            workoutTimerInterval = null;
        }
        workoutStartTime = null;
        workoutTimerEl.textContent = '00:00:00';
    }

    // --- Rest Timer --- //

    function startRestTimer(seconds) {
        clearRestTimer();
        restTimeRemaining = seconds;
        restTimerPaused = false;
        restTimerPresets.classList.add('hidden');
        restTimerCountdown.classList.remove('hidden');
        restTimerDisplay.textContent = formatDuration(restTimeRemaining);
        restTimerPauseBtn.textContent = 'Pause';

        restTimerInterval = setInterval(() => {
            if (!restTimerPaused) {
                restTimeRemaining--;
                restTimerDisplay.textContent = formatDuration(Math.max(0, restTimeRemaining));
                if (restTimeRemaining <= 0) {
                    clearInterval(restTimerInterval);
                    restTimerInterval = null;
                    notifyRestComplete();
                    // Auto-reset after 2 seconds
                    setTimeout(() => {
                        resetRestTimerUI();
                    }, 2000);
                }
            }
        }, 1000);
    }

    function clearRestTimer() {
        if (restTimerInterval) {
            clearInterval(restTimerInterval);
            restTimerInterval = null;
        }
        restTimeRemaining = 0;
        restTimerPaused = false;
    }

    function resetRestTimerUI() {
        clearRestTimer();
        restTimerPresets.classList.remove('hidden');
        restTimerCountdown.classList.add('hidden');
    }

    function notifyRestComplete() {
        // Audio beep
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 880;
            osc.type = 'sine';
            gain.gain.value = 0.3;
            osc.start();
            osc.stop(ctx.currentTime + 0.3);
            // Second beep
            setTimeout(() => {
                const osc2 = ctx.createOscillator();
                const gain2 = ctx.createGain();
                osc2.connect(gain2);
                gain2.connect(ctx.destination);
                osc2.frequency.value = 880;
                osc2.type = 'sine';
                gain2.gain.value = 0.3;
                osc2.start();
                osc2.stop(ctx.currentTime + 0.3);
            }, 350);
        } catch (e) {
            // Audio not available
        }
        // Vibration
        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
        }
        restTimerDisplay.textContent = "Done!";
    }

    // Rest timer event listeners
    document.querySelectorAll('.rest-preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            startRestTimer(parseInt(btn.dataset.seconds, 10));
        });
    });

    restCustomBtn.addEventListener('click', () => {
        const input = prompt('Enter rest time in seconds:');
        if (input && !isNaN(input) && parseInt(input, 10) > 0) {
            startRestTimer(parseInt(input, 10));
        }
    });

    restTimerPauseBtn.addEventListener('click', () => {
        restTimerPaused = !restTimerPaused;
        restTimerPauseBtn.textContent = restTimerPaused ? 'Resume' : 'Pause';
    });

    restTimerResetBtn.addEventListener('click', () => {
        resetRestTimerUI();
    });


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

        // Progress Tracker
        populateProgressExerciseSelect(workouts);
    }

    function getExerciseTypeFromWorkouts(exerciseName, workouts) {
        for (const w of workouts) {
            const ex = w.exercises.find(e => e.name === exerciseName);
            if (ex && ex.type) return ex.type;
        }
        return 'weighted';
    }

    function populateProgressExerciseSelect(workouts) {
        const allExercises = [...new Set(workouts.flatMap(w => w.exercises.map(e => e.name)))];
        const prevValue = progressExerciseSelect.value;
        progressExerciseSelect.innerHTML = '<option value="">Select an exercise</option>';
        allExercises.forEach(ex => {
            const type = getExerciseTypeFromWorkouts(ex, workouts);
            const typeLabel = EXERCISE_TYPES[type]?.label || '';
            const suffix = typeLabel && type !== 'weighted' ? ` (${typeLabel})` : '';
            progressExerciseSelect.innerHTML += `<option value="${ex}">${ex}${suffix}</option>`;
        });

        if (prevValue && allExercises.includes(prevValue)) {
            progressExerciseSelect.value = prevValue;
            renderProgressChart(prevValue);
        } else if (allExercises.length > 0) {
            progressExerciseSelect.value = allExercises[0];
            renderProgressChart(allExercises[0]);
        }
    }

    progressExerciseSelect.addEventListener('change', async (e) => {
        const exerciseName = e.target.value;
        if (exerciseName) {
            renderProgressChart(exerciseName);
        }
    });

    async function renderProgressChart(exerciseName) {
        if (!currentUser) return;

        const { data: workouts, error } = await supabase
            .from('workouts')
            .select('date, exercises')
            .eq('user_id', currentUser.id)
            .order('date', { ascending: true });

        if (error) {
            console.error('Error loading workout data for progress chart:', error);
            return;
        }

        const exerciseWorkouts = workouts.filter(w => w.exercises.some(e => e.name === exerciseName));
        const last10Workouts = exerciseWorkouts.slice(-10);

        const type = getExerciseTypeFromWorkouts(exerciseName, workouts);
        const chartColors = getChartColors();

        const chartData = { labels: [], data: [] };
        let chartLabel = '';
        let datasetColor = 'rgba(75, 192, 192, 1)';
        let datasetBg = 'rgba(75, 192, 192, 0.2)';

        if (type === 'timed' || type === 'timed_weighted') {
            chartLabel = `Max Duration for ${exerciseName} (seconds)`;
            last10Workouts.forEach(workout => {
                const exercise = workout.exercises.find(e => e.name === exerciseName);
                if (exercise) {
                    let maxDur = 0;
                    exercise.sets.forEach(set => {
                        if (set.duration && set.duration > maxDur) maxDur = set.duration;
                    });
                    if (maxDur > 0) {
                        chartData.labels.push(new Date(workout.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
                        chartData.data.push(maxDur);
                    }
                }
            });
            datasetColor = 'rgba(153, 102, 255, 1)';
            datasetBg = 'rgba(153, 102, 255, 0.2)';
        } else if (type === 'cardio') {
            chartLabel = `Distance for ${exerciseName}`;
            last10Workouts.forEach(workout => {
                const exercise = workout.exercises.find(e => e.name === exerciseName);
                if (exercise) {
                    let totalDist = 0;
                    exercise.sets.forEach(set => {
                        if (set.distance) totalDist += parseFloat(set.distance) || 0;
                    });
                    if (totalDist > 0) {
                        chartData.labels.push(new Date(workout.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
                        chartData.data.push(totalDist.toFixed(1));
                    }
                }
            });
            datasetColor = 'rgba(255, 159, 64, 1)';
            datasetBg = 'rgba(255, 159, 64, 0.2)';
        } else if (type === 'reps_only' || type === 'bodyweight') {
            chartLabel = `Max Reps for ${exerciseName}`;
            last10Workouts.forEach(workout => {
                const exercise = workout.exercises.find(e => e.name === exerciseName);
                if (exercise) {
                    let maxReps = 0;
                    exercise.sets.forEach(set => {
                        const r = parseInt(set.reps, 10) || 0;
                        if (r > maxReps) maxReps = r;
                    });
                    if (maxReps > 0) {
                        chartData.labels.push(new Date(workout.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
                        chartData.data.push(maxReps);
                    }
                }
            });
            datasetColor = 'rgba(54, 162, 235, 1)';
            datasetBg = 'rgba(54, 162, 235, 0.2)';
        } else {
            // weighted — 1RM
            chartLabel = `1 Rep Max Progress for ${exerciseName}`;
            last10Workouts.forEach(workout => {
                const exercise = workout.exercises.find(e => e.name === exerciseName);
                if (exercise) {
                    let max1RM = 0;
                    exercise.sets.forEach(set => {
                        if (set.weight && set.reps) {
                            const oneRM = set.weight * (1 + set.reps / 30);
                            if (oneRM > max1RM) max1RM = oneRM;
                        }
                    });
                    if (max1RM > 0) {
                        chartData.labels.push(new Date(workout.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
                        chartData.data.push(max1RM.toFixed(1));
                    }
                }
            });
        }

        if (progressChart) {
            progressChart.destroy();
        }

        progressChart = new Chart(progressChartCanvas, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: [{
                    label: chartLabel,
                    data: chartData.data,
                    backgroundColor: datasetBg,
                    borderColor: datasetColor,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { display: false },
                        ticks: { color: chartColors.tickColor }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: chartColors.tickColor }
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: chartColors.legendColor }
                    }
                }
            }
        });
    }



    function calculateAndDisplayOneRepMax(exerciseName, cardIndex, workouts) {
        if (!exerciseName) {
            oneRepMaxValues[cardIndex].textContent = '-';
            return;
        }

        // Only calculate 1RM for weighted exercises
        const type = getExerciseTypeFromWorkouts(exerciseName, workouts);
        if (type !== 'weighted' && type !== 'bodyweight') {
            // Show relevant metric instead
            if (type === 'timed' || type === 'timed_weighted') {
                let maxDur = 0;
                workouts.forEach(w => w.exercises.forEach(ex => {
                    if (ex.name === exerciseName) {
                        ex.sets.forEach(s => { if (s.duration > maxDur) maxDur = s.duration; });
                    }
                }));
                oneRepMaxValues[cardIndex].textContent = maxDur > 0 ? formatDuration(maxDur) : '-';
            } else {
                oneRepMaxValues[cardIndex].textContent = '-';
            }
            return;
        }

        let max1RM = 0;
        workouts.forEach(workout => {
            workout.exercises.forEach(ex => {
                if (ex.name === exerciseName) {
                    ex.sets.forEach(set => {
                        if (set.weight && set.reps) {
                            const oneRM = set.weight * (1 + set.reps / 30);
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
                    const type = ex.type || 'weighted';
                    // Only sum volume for weighted exercises
                    if (type !== 'weighted' && type !== 'timed_weighted') return total;
                    return total + ex.sets.reduce((setTotal, set) => {
                        return setTotal + (set.weight * set.reps || 0);
                    }, 0);
                }, 0);
                weeklyData[weekStart] += volume;
            }
        });

        const labels = Object.keys(weeklyData).map(ws => new Date(ws).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        const dataInTons = Object.values(weeklyData).map(kg => kg / 1000);
        const chartColors = getChartColors();

        if (weeklyVolumeChart) {
            weeklyVolumeChart.destroy();
        }

        weeklyVolumeChart = new Chart(weeklyVolumeChartCanvas, {
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
                        grid: { display: false },
                        ticks: { color: chartColors.tickColor }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: chartColors.tickColor }
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: chartColors.legendColor }
                    }
                }
            }
        });
    }


    // --- Workout History --- //

    function formatSetDisplay(set, type) {
        switch (type) {
            case 'timed':
                return formatDuration(set.duration || 0);
            case 'timed_weighted':
                return `${convertWeight(set.weight, weightUnit)} ${weightUnit} — ${formatDuration(set.duration || 0)}`;
            case 'cardio': {
                const distUnit = weightUnit === 'lbs' ? 'mi' : 'km';
                const dist = set.distance ? `${set.distance} ${distUnit}` : '';
                return `${formatDuration(set.duration || 0)}${dist ? ' — ' + dist : ''}`;
            }
            case 'bodyweight':
                return `Bodyweight x ${set.reps} reps`;
            case 'reps_only':
                return `${set.reps} reps`;
            case 'weighted':
            default:
                return `${convertWeight(set.weight, weightUnit)} ${weightUnit} x ${set.reps} reps`;
        }
    }

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
            div.className = 'bg-white dark:bg-gray-800 p-4 rounded shadow mb-4';
            const workoutDate = new Date(workout.date).toLocaleString();
            div.innerHTML = `
                <div class="flex justify-between items-center">
                    <div>
                        <h3 class="text-xl font-bold">${workout.routine_name}</h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400">${workoutDate}</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <button class="view-workout-details-btn bg-gray-200 dark:bg-gray-700 dark:text-gray-200 px-3 py-1 rounded" data-id="${workout.id}">Details</button>
                        <button class="delete-workout-btn bg-red-500 text-white px-3 py-1 rounded" data-id="${workout.id}">Delete</button>
                    </div>
                </div>
                <div class="workout-details hidden mt-4">
                    ${workout.exercises.map(ex => {
                        const type = ex.type || (ex.bodyweight ? 'bodyweight' : 'weighted');
                        const typeLabel = EXERCISE_TYPES[type]?.label || '';
                        const suffix = type !== 'weighted' ? ` (${typeLabel})` : '';
                        return `
                            <div class="mb-2">
                                <h5 class="font-semibold">${ex.name}${suffix}</h5>
                                <ul class="list-disc list-inside pl-2">
                                    ${ex.sets.map(set => `<li>${formatSetDisplay(set, type)}</li>`).join('')}
                                </ul>
                            </div>
                        `;
                    }).join('')}
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
            const details = target.closest('.bg-white, .dark\\:bg-gray-800').querySelector('.workout-details');
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
    const kgToLbs = (kg) => (kg * 2.20462);
    const lbsToKg = (lbs) => (lbs / 2.20462);

    function convertWeight(weightInKg, toUnit) {
        if (weightInKg === null || weightInKg === '' || isNaN(weightInKg)) return '';
        if (toUnit === 'lbs') {
            return kgToLbs(weightInKg).toFixed(1);
        }
        return parseFloat(weightInKg).toFixed(1);
    }


    // --- Profile Management ---

    cancelProfileBtn.addEventListener('click', () => showSection('dashboard'));

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
            weightUnit = 'kg';
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
            showSection('dashboard');
        }
    });

    // Initial Load
    checkUser();
});
