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
    const authForm = document.getElementById('auth-form');
    const authTitle = document.getElementById('auth-title');
    const authSwitchLink = document.getElementById('auth-switch-link');
    const authMessage = document.getElementById('auth-message');
    let isLogin = true;

    // Main App Buttons
    const addRoutineBtn = document.getElementById('add-routine-btn');
    const cancelRoutineBtn = document.getElementById('cancel-routine-btn');
    const addExerciseBtn = document.getElementById('add-exercise-btn');
    const logoutBtn = document.getElementById('logout-btn');

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

    // Workout guided flow elements
    const workoutCurrentSetEl = document.getElementById('workout-current-set');
    const workoutProgressText = document.getElementById('workout-progress-text');
    const workoutProgressFill = document.getElementById('workout-progress-fill');

    // Bottom Tab Bar
    const bottomTabBar = document.getElementById('bottom-tab-bar');

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
    let lastRestDuration = 90; // default rest time
    let restTimerEndTime = null; // timestamp when rest timer should finish

    // Stopwatch state for timed exercises
    let activeStopwatchInterval = null;
    let activeStopwatchStart = null;

    // Guided workout state
    let currentWorkout = null;
    let currentExIndex = 0;
    let currentSetIndex = 0;
    let workoutPhase = 'ready'; // 'ready' | 'in_set' | 'resting' | 'done' | 'add_exercise'
    let isFreestyle = false;

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
            localStorage.setItem('theme', 'dark');
            document.documentElement.classList.add('dark');
        } else if (saved === 'dark') {
            localStorage.setItem('theme', 'light');
            document.documentElement.classList.remove('dark');
        } else {
            localStorage.removeItem('theme');
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.classList.toggle('dark', prefersDark);
        }
        updateThemeIcon();
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
        bottomTabBar.classList.add('hidden');
        if (view === 'login') authSection.classList.remove('hidden');
        else if (view === 'forgot') forgotPasswordSection.classList.remove('hidden');
        else if (view === 'reset') resetPasswordSection.classList.remove('hidden');
    }

    let isPasswordRecovery = false;

    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (isPasswordRecovery) return;
        if (session) {
            currentUser = session.user;
            authSection.classList.add('hidden');
            forgotPasswordSection.classList.add('hidden');
            resetPasswordSection.classList.add('hidden');
            appSection.classList.remove('hidden');
            unitToggleContainer.classList.remove('hidden');
            await loadUserProfile();
            loadDashboardData();
            loadRoutines();
            showSection('dashboard');
        } else {
            currentUser = null;
            appSection.classList.add('hidden');
            bottomTabBar.classList.add('hidden');
            unitToggleContainer.classList.add('hidden');
            showAuthView('login');
        }
    };

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

        // Show/hide bottom tab bar (hidden during workout and routine form)
        if (sectionName === 'workout' || sectionName === 'routine-form') {
            bottomTabBar.classList.add('hidden');
        } else {
            bottomTabBar.classList.remove('hidden');
        }

        // Update active tab
        updateActiveTab(sectionName);
    }

    function updateActiveTab(sectionName) {
        const tabMap = {
            'dashboard': 'dashboard',
            'routines': 'routines',
            'history': 'history',
            'profile': 'profile',
        };
        const activeTab = tabMap[sectionName] || '';
        document.querySelectorAll('.tab-btn').forEach(btn => {
            const isActive = btn.dataset.tab === activeTab;
            if (isActive) {
                btn.classList.remove('text-gray-400', 'dark:text-gray-500');
                btn.classList.add('text-indigo-600', 'dark:text-indigo-400');
            } else {
                btn.classList.remove('text-indigo-600', 'dark:text-indigo-400');
                btn.classList.add('text-gray-400', 'dark:text-gray-500');
            }
        });
    }

    // Bottom tab bar navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            if (tab === 'history') {
                loadWorkoutHistory();
            }
            if (tab === 'profile') {
                openProfilePage();
            }
            if (tab === 'dashboard') {
                loadDashboardData();
            }
            showSection(tab);
        });
    });

    document.getElementById('freestyle-workout-btn').addEventListener('click', () => startFreestyleWorkout());

    addRoutineBtn.addEventListener('click', () => {
        routineFormTitle.textContent = 'Add Routine';
        routineForm.reset();
        routineIdInput.value = '';
        exercisesContainer.innerHTML = '';
        addExerciseInput();
        showSection('routine-form');
    });

    cancelRoutineBtn.addEventListener('click', () => showSection('routines'));
    cancelProfileBtn.addEventListener('click', () => showSection('dashboard'));

    unitToggle.addEventListener('change', async () => {
        weightUnit = unitToggle.checked ? 'lbs' : 'kg';
        if (currentUser) {
            await supabase.from('profiles').upsert({ user_id: currentUser.id, weight_unit: weightUnit }, { onConflict: 'user_id' });
        }
        if (!routinesSection.classList.contains('hidden')) {
            loadRoutines();
        } else if (!workoutSection.classList.contains('hidden')) {
            renderCurrentSet();
        } else if (!historySection.classList.contains('hidden')) {
            loadWorkoutHistory();
        }
    });


    // --- Routine Management --- //

    addExerciseBtn.addEventListener('click', () => addExerciseInput());

    function addExerciseInput(name = '', sets = 3, type = 'weighted') {
        const div = document.createElement('div');
        div.className = 'card bg-white dark:bg-gray-900 p-3 exercise-row';
        const typeOptions = Object.entries(EXERCISE_TYPES).map(([key, val]) =>
            `<option value="${key}" ${key === type ? 'selected' : ''}>${val.label}</option>`
        ).join('');
        div.innerHTML = `
            <div class="flex items-center gap-2">
                <input type="text" class="input-styled flex-1 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white exercise-name" placeholder="Exercise name" value="${name}" required>
                <button type="button" class="remove-exercise-btn p-2 text-red-400 hover:text-red-600 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
            </div>
            <div class="flex items-center gap-2 mt-2">
                <div class="flex items-center gap-1.5">
                    <label class="text-xs text-gray-500 dark:text-gray-400">Sets</label>
                    <input type="number" class="input-styled w-16 px-2 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm dark:text-white text-center exercise-sets" value="${sets}" min="1" required>
                </div>
                <div class="flex-1">
                    <select class="input-styled w-full px-2 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm dark:text-white exercise-type">${typeOptions}</select>
                </div>
            </div>
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

        const emptyState = document.getElementById('routines-empty-state');
        routinesList.innerHTML = '';

        if (routines.length === 0) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
            routines.forEach(routine => {
                const exerciseCount = routine.exercises ? routine.exercises.length : 0;
                const totalSets = routine.exercises ? routine.exercises.reduce((sum, ex) => sum + (ex.sets || 0), 0) : 0;
                const div = document.createElement('div');
                div.className = 'card bg-white dark:bg-gray-900 p-4';
                div.innerHTML = `
                    <div class="flex items-center justify-between">
                        <div class="flex-1 min-w-0">
                            <h3 class="text-lg font-bold truncate">${routine.name}</h3>
                            <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">${exerciseCount} exercises · ${totalSets} sets</p>
                        </div>
                        <div class="flex items-center gap-2 ml-3">
                            <button class="edit-routine-btn p-2 text-gray-400 hover:text-indigo-500 transition-colors" data-id="${routine.id}" title="Edit">
                                <svg class="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                            </button>
                            <button class="delete-routine-btn p-2 text-gray-400 hover:text-red-500 transition-colors" data-id="${routine.id}" title="Delete">
                                <svg class="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                            </button>
                        </div>
                    </div>
                    <button class="start-workout-btn btn-press mt-3 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2" data-id="${routine.id}" data-name="${routine.name}">
                        <svg class="w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        Start Workout
                    </button>
                `;
                routinesList.appendChild(div);
            });
        }
    }

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


    // --- Guided Workout Flow --- //

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
        isFreestyle = false;
        const { data: routine, error } = await supabase.from('routines').select('exercises').eq('id', routineId).single();
        if (error) {
            alert("Could not fetch routine details.");
            return;
        }

        const { data: profile } = await supabase
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

        currentExIndex = 0;
        currentSetIndex = 0;
        workoutPhase = 'ready';

        document.getElementById('workout-routine-name').textContent = routineName;
        showSection('workout');
        startWorkoutTimer();
        renderCurrentSet();
    }

    async function startFreestyleWorkout() {
        const { data: profile } = await supabase
            .from('profiles')
            .select('body_weight, weight_unit')
            .eq('user_id', currentUser.id)
            .single();

        if (profile && profile.weight_unit) {
            weightUnit = profile.weight_unit;
            unitToggle.checked = weightUnit === 'lbs';
        }

        isFreestyle = true;
        currentWorkout = {
            routine_id: null,
            routine_name: 'Freestyle Workout',
            body_weight: profile ? profile.body_weight : 0,
            exercises: []
        };

        currentExIndex = 0;
        currentSetIndex = 0;
        workoutPhase = 'add_exercise';

        document.getElementById('workout-routine-name').textContent = 'Freestyle Workout';
        showSection('workout');
        startWorkoutTimer();
        renderCurrentSet();
    }

    function getTotalSets() {
        if (!currentWorkout) return 0;
        return currentWorkout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
    }

    function getCompletedSets() {
        if (!currentWorkout) return 0;
        let count = 0;
        for (let i = 0; i < currentWorkout.exercises.length; i++) {
            for (let j = 0; j < currentWorkout.exercises[i].sets.length; j++) {
                if (i < currentExIndex || (i === currentExIndex && j < currentSetIndex)) {
                    count++;
                }
            }
        }
        return count;
    }

    function updateProgressBar() {
        const total = getTotalSets();
        const completed = getCompletedSets();
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

        const exercise = currentWorkout.exercises[currentExIndex];
        if (workoutPhase === 'done') {
            workoutProgressText.textContent = 'Workout Complete!';
            workoutProgressFill.style.width = '100%';
        } else {
            workoutProgressText.textContent = `Exercise ${currentExIndex + 1}/${currentWorkout.exercises.length} · Set ${currentSetIndex + 1}/${exercise.sets.length}`;
            workoutProgressFill.style.width = `${percent}%`;
        }
    }

    function renderCurrentSet() {
        if (!currentWorkout) return;

        if (workoutPhase === 'done') {
            renderWorkoutSummary();
            return;
        }

        if (workoutPhase === 'add_exercise') {
            updateProgressBar();
            renderAddExercisePhase();
            return;
        }

        const exercise = currentWorkout.exercises[currentExIndex];
        const set = exercise.sets[currentSetIndex];
        const type = exercise.type || 'weighted';
        const typeLabel = EXERCISE_TYPES[type]?.label || 'Weighted';

        updateProgressBar();

        let html = '';

        if (workoutPhase === 'ready') {
            html = renderReadyPhase(exercise, set, type, typeLabel);
        } else if (workoutPhase === 'in_set') {
            html = renderInSetPhase(exercise, set, type, typeLabel);
        } else if (workoutPhase === 'resting') {
            html = renderRestingPhase(exercise, set, type);
        }

        workoutCurrentSetEl.innerHTML = html;
        attachWorkoutEventListeners();
    }

    function renderReadyPhase(exercise, set, type, typeLabel) {
        const setNum = currentSetIndex + 1;
        const totalSets = exercise.sets.length;

        let fieldsHtml = '';

        if (type === 'weighted' || type === 'timed_weighted') {
            fieldsHtml += `
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Weight (${weightUnit})</label>
                    <input type="number" id="guided-weight" class="input-styled w-full px-4 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-2xl font-bold text-center dark:text-white" placeholder="0" value="${set.weight}" inputmode="decimal">
                </div>
            `;
        }

        if (type === 'weighted' || type === 'bodyweight' || type === 'reps_only') {
            fieldsHtml += `
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Target Reps</label>
                    <input type="number" id="guided-reps" class="input-styled w-full px-4 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-2xl font-bold text-center dark:text-white" placeholder="0" value="${set.reps}" inputmode="numeric">
                </div>
            `;
        }

        if (type === 'cardio') {
            const distUnit = weightUnit === 'lbs' ? 'mi' : 'km';
            fieldsHtml += `
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Distance (${distUnit})</label>
                    <input type="number" step="0.1" id="guided-distance" class="input-styled w-full px-4 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-2xl font-bold text-center dark:text-white" placeholder="0" value="${set.distance}" inputmode="decimal">
                </div>
            `;
        }

        const isTimedType = type === 'timed' || type === 'timed_weighted' || type === 'cardio';
        const startBtnText = isTimedType ? 'Start Timer' : 'Log Set';
        const startBtnIcon = isTimedType
            ? '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/></svg>'
            : '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>';

        return `
            <div class="text-center mb-6">
                <p class="text-sm font-medium text-indigo-500 dark:text-indigo-400 uppercase tracking-wide">${typeLabel}</p>
                <h3 class="text-3xl font-bold mt-1">${exercise.name}</h3>
                <p class="text-lg text-gray-400 dark:text-gray-500 mt-1">Set ${setNum} of ${totalSets}</p>
            </div>
            <div class="card bg-white dark:bg-gray-900 p-6 mb-4">
                ${fieldsHtml}
                <button id="start-set-btn" class="btn-press w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2 pulse-ring">
                    ${startBtnIcon}
                    ${startBtnText}
                </button>
            </div>
            ${renderNavButtons()}
        `;
    }

    function renderInSetPhase(exercise, set, type, typeLabel) {
        const setNum = currentSetIndex + 1;
        const totalSets = exercise.sets.length;
        const isTimedType = type === 'timed' || type === 'timed_weighted' || type === 'cardio';

        if (isTimedType) {
            const duration = set.duration || 0;
            return `
                <div class="text-center mb-6">
                    <p class="text-sm font-medium text-indigo-500 dark:text-indigo-400 uppercase tracking-wide">${typeLabel}</p>
                    <h3 class="text-3xl font-bold mt-1">${exercise.name}</h3>
                    <p class="text-lg text-gray-400 dark:text-gray-500 mt-1">Set ${setNum} of ${totalSets}</p>
                </div>
                <div class="card bg-white dark:bg-gray-900 p-8 mb-4 text-center">
                    <div id="stopwatch-display" class="text-6xl font-mono font-bold text-indigo-600 dark:text-indigo-400 mb-6 countdown-pulse">${formatDuration(duration)}</div>
                    <button id="stop-set-btn" class="btn-press w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"/></svg>
                        Stop
                    </button>
                </div>
            `;
        }

        // Non-timed: show reps input and Done button
        return `
            <div class="text-center mb-6">
                <p class="text-sm font-medium text-indigo-500 dark:text-indigo-400 uppercase tracking-wide">${typeLabel}</p>
                <h3 class="text-3xl font-bold mt-1">${exercise.name}</h3>
                <p class="text-lg text-gray-400 dark:text-gray-500 mt-1">Set ${setNum} of ${totalSets}</p>
            </div>
            <div class="card bg-white dark:bg-gray-900 p-6 mb-4">
                ${(type === 'weighted' || type === 'timed_weighted') ? `
                    <div class="text-center mb-4">
                        <span class="text-3xl font-bold">${set.weight || 0}</span>
                        <span class="text-lg text-gray-400 ml-1">${weightUnit}</span>
                    </div>
                ` : ''}
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Reps completed</label>
                    <input type="number" id="guided-reps-done" class="input-styled w-full px-4 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-2xl font-bold text-center dark:text-white" placeholder="0" value="${set.reps}" inputmode="numeric" autofocus>
                </div>
                <button id="done-set-btn" class="btn-press w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                    Done
                </button>
            </div>
        `;
    }

    function renderRestingPhase(exercise, set, type) {
        const setNum = currentSetIndex + 1;
        const totalSets = exercise.sets.length;

        // Build set summary
        let summary = '';
        if (type === 'weighted') {
            summary = `${set.weight || 0} ${weightUnit} × ${set.reps || 0} reps`;
        } else if (type === 'bodyweight' || type === 'reps_only') {
            summary = `${set.reps || 0} reps`;
        } else if (type === 'timed' || type === 'timed_weighted') {
            summary = formatDuration(set.duration || 0);
            if (type === 'timed_weighted') summary = `${set.weight || 0} ${weightUnit} — ${summary}`;
        } else if (type === 'cardio') {
            const distUnit = weightUnit === 'lbs' ? 'mi' : 'km';
            summary = `${formatDuration(set.duration || 0)}`;
            if (set.distance) summary += ` — ${set.distance} ${distUnit}`;
        }

        const isLastSet = isAtLastSet();
        const isLastSetOfExercise = currentSetIndex >= exercise.sets.length - 1;
        let nextBtnText, nextBtnIcon;
        if (isFreestyle && isLastSetOfExercise) {
            nextBtnText = 'Next Exercise';
            nextBtnIcon = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>';
        } else if (isLastSet) {
            nextBtnText = 'Finish Workout';
            nextBtnIcon = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
        } else {
            nextBtnText = 'Next Set';
            nextBtnIcon = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>';
        }

        return `
            <div class="text-center mb-4">
                <div class="inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-4 py-1.5 rounded-full text-sm font-semibold mb-3">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                    Set ${setNum} Complete
                </div>
                <p class="text-lg font-semibold text-gray-600 dark:text-gray-300">${summary}</p>
            </div>

            <div class="card bg-white dark:bg-gray-900 p-8 mb-4 text-center">
                <p class="text-sm font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Rest Timer</p>
                <div id="rest-display" class="text-6xl font-mono font-bold text-indigo-600 dark:text-indigo-400 mb-4 countdown-pulse">${formatDuration(restTimeRemaining)}</div>
                <div class="flex items-center justify-center gap-2 mb-6">
                    <button class="rest-adjust-btn btn-press px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" data-seconds="30">0:30</button>
                    <button class="rest-adjust-btn btn-press px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" data-seconds="60">1:00</button>
                    <button class="rest-adjust-btn btn-press px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" data-seconds="90">1:30</button>
                    <button class="rest-adjust-btn btn-press px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" data-seconds="120">2:00</button>
                    <button class="rest-adjust-btn btn-press px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" data-seconds="180">3:00</button>
                </div>
                <button id="next-set-btn" class="btn-press w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2">
                    ${nextBtnIcon}
                    ${nextBtnText}
                </button>
            </div>
            <div class="flex justify-center gap-3">
                <button id="add-extra-set-btn" class="btn-press px-4 py-2 rounded-xl text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">+ Add Set</button>
                ${isFreestyle ? `<button id="freestyle-finish-from-rest-btn" class="btn-press px-4 py-2 rounded-xl text-sm font-medium border border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">Finish Workout</button>` : ''}
            </div>
        `;
    }

    function renderWorkoutSummary() {
        const elapsedSeconds = workoutStartTime ? Math.floor((Date.now() - workoutStartTime) / 1000) : 0;
        const totalExercises = currentWorkout.exercises.length;
        const totalSets = getTotalSets();
        let totalVolume = 0;

        currentWorkout.exercises.forEach(ex => {
            const type = ex.type || 'weighted';
            if (type === 'weighted' || type === 'timed_weighted') {
                ex.sets.forEach(set => {
                    const w = parseFloat(set.weight) || 0;
                    const r = parseInt(set.reps, 10) || 0;
                    totalVolume += w * r;
                });
            }
        });

        updateProgressBar();

        const volumeDisplay = weightUnit === 'lbs'
            ? `${totalVolume.toFixed(0)} lbs`
            : `${(totalVolume).toFixed(0)} ${weightUnit}`;

        workoutCurrentSetEl.innerHTML = `
            <div class="text-center mb-6">
                <div class="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-4">
                    <svg class="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                </div>
                <h3 class="text-2xl font-bold">Workout Complete!</h3>
            </div>

            <div class="card bg-white dark:bg-gray-900 p-6 mb-4">
                <div class="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <p class="text-2xl font-bold">${formatDurationLong(elapsedSeconds)}</p>
                        <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">Duration</p>
                    </div>
                    <div>
                        <p class="text-2xl font-bold">${totalExercises}</p>
                        <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">Exercises</p>
                    </div>
                    <div>
                        <p class="text-2xl font-bold">${totalSets}</p>
                        <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">Sets</p>
                    </div>
                </div>
                ${totalVolume > 0 ? `
                    <div class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-center">
                        <p class="text-2xl font-bold">${volumeDisplay}</p>
                        <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">Total Volume</p>
                    </div>
                ` : ''}
            </div>

            <div class="space-y-3">
                ${currentWorkout.exercises.map(ex => {
                    const type = ex.type || 'weighted';
                    return `
                        <div class="card bg-white dark:bg-gray-900 p-4">
                            <h4 class="font-semibold text-sm">${ex.name}</h4>
                            <div class="mt-2 space-y-1">
                                ${ex.sets.map((s, i) => `<p class="text-xs text-gray-500 dark:text-gray-400">Set ${i + 1}: ${formatSetDisplay(s, type)}</p>`).join('')}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>

            <button id="save-workout-btn" class="btn-press mt-6 w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                Save Workout
            </button>
            <button id="discard-workout-btn" class="btn-press mt-3 w-full py-3 rounded-xl text-sm font-medium border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">Discard</button>
        `;

        // Attach listeners for summary phase
        document.getElementById('save-workout-btn')?.addEventListener('click', () => finishWorkout());
        document.getElementById('discard-workout-btn')?.addEventListener('click', () => {
            if (confirm('Discard this workout?')) {
                currentWorkout = null;
                isFreestyle = false;
                clearWorkoutTimer();
                clearRestTimer();
                showSection('dashboard');
            }
        });
    }

    function renderNavButtons() {
        const canGoBack = currentExIndex > 0 || currentSetIndex > 0;
        const hasCopyPrevious = true;

        return `
            <div class="flex items-center justify-between mt-2">
                <div class="flex gap-2">
                    ${canGoBack ? `
                        <button id="prev-set-btn" class="btn-press px-3 py-2 rounded-xl text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-1">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 17l-5-5m0 0l5-5m-5 5h12"/></svg>
                            Back
                        </button>
                    ` : ''}
                    <button id="skip-set-btn" class="btn-press px-3 py-2 rounded-xl text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Skip Set</button>
                </div>
                <div class="flex gap-2">
                    <button id="copy-previous-btn" class="btn-press px-3 py-2 rounded-xl text-sm font-medium border border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors flex items-center gap-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                        Copy Prev
                    </button>
                    <button id="cancel-workout-nav-btn" class="btn-press px-3 py-2 rounded-xl text-sm font-medium border border-red-300 dark:border-red-800 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">Cancel</button>
                </div>
            </div>
        `;
    }

    function renderAddExercisePhase() {
        const typeOptions = Object.entries(EXERCISE_TYPES).map(([key, val]) =>
            `<option value="${key}" ${key === 'weighted' ? 'selected' : ''}>${val.label}</option>`
        ).join('');

        const exerciseNum = currentWorkout.exercises.length + 1;

        workoutCurrentSetEl.innerHTML = `
            <div class="text-center mb-6">
                <h3 class="text-2xl font-bold mt-1">Add Exercise #${exerciseNum}</h3>
                <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">What are you working on next?</p>
            </div>
            <div class="card bg-white dark:bg-gray-900 p-6 mb-4">
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Exercise Name</label>
                    <input type="text" id="freestyle-exercise-name" class="input-styled w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white" placeholder="e.g. Bench Press" autofocus>
                </div>
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Type</label>
                    <select id="freestyle-exercise-type" class="input-styled w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white">
                        ${typeOptions}
                    </select>
                </div>
                <button id="freestyle-add-exercise-btn" class="btn-press w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                    Start Exercise
                </button>
            </div>
            ${currentWorkout.exercises.length > 0 ? `
                <button id="freestyle-finish-btn" class="btn-press w-full py-3 rounded-xl text-sm font-medium border border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors flex items-center justify-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                    Finish Workout
                </button>
            ` : `
                <button id="cancel-workout-nav-btn" class="btn-press w-full py-3 rounded-xl text-sm font-medium border border-red-300 dark:border-red-800 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">Cancel</button>
            `}
        `;

        document.getElementById('freestyle-add-exercise-btn')?.addEventListener('click', () => {
            const name = document.getElementById('freestyle-exercise-name').value.trim();
            const type = document.getElementById('freestyle-exercise-type').value;
            if (!name) {
                document.getElementById('freestyle-exercise-name').focus();
                return;
            }
            const newExercise = {
                name: name,
                type: type,
                sets: [createEmptySet(type)]
            };
            currentWorkout.exercises.push(newExercise);
            currentExIndex = currentWorkout.exercises.length - 1;
            currentSetIndex = 0;
            workoutPhase = 'ready';
            renderCurrentSet();
        });

        document.getElementById('freestyle-finish-btn')?.addEventListener('click', () => {
            workoutPhase = 'done';
            renderCurrentSet();
        });

        document.getElementById('cancel-workout-nav-btn')?.addEventListener('click', () => {
            if (confirm('Cancel this workout? All progress will be lost.')) {
                currentWorkout = null;
                isFreestyle = false;
                clearWorkoutTimer();
                clearRestTimer();
                showSection('routines');
            }
        });
    }

    function attachWorkoutEventListeners() {
        // Start Set / Log Set
        document.getElementById('start-set-btn')?.addEventListener('click', () => {
            saveCurrentInputs();
            const exercise = currentWorkout.exercises[currentExIndex];
            const type = exercise.type || 'weighted';
            const isTimedType = type === 'timed' || type === 'timed_weighted' || type === 'cardio';

            if (isTimedType) {
                // Start stopwatch
                workoutPhase = 'in_set';
                startActiveStopwatch();
                renderCurrentSet();
            } else {
                // For non-timed, go straight to in_set where they enter reps and hit Done
                workoutPhase = 'in_set';
                renderCurrentSet();
            }
        });

        // Stop (timed exercises)
        document.getElementById('stop-set-btn')?.addEventListener('click', () => {
            stopActiveStopwatch();
            completeCurrentSet();
        });

        // Done with Set (non-timed)
        document.getElementById('done-set-btn')?.addEventListener('click', () => {
            // Save reps from the done phase
            const repsInput = document.getElementById('guided-reps-done');
            if (repsInput) {
                currentWorkout.exercises[currentExIndex].sets[currentSetIndex].reps = repsInput.value;
            }
            completeCurrentSet();
        });

        // Next Set (from rest)
        document.getElementById('next-set-btn')?.addEventListener('click', () => {
            clearRestTimer();
            const exercise = currentWorkout.exercises[currentExIndex];
            const isLastSetOfExercise = currentSetIndex >= exercise.sets.length - 1;
            if (isFreestyle && isLastSetOfExercise) {
                workoutPhase = 'add_exercise';
                renderCurrentSet();
            } else if (isAtLastSet()) {
                workoutPhase = 'done';
                renderCurrentSet();
            } else {
                advanceToNextSet();
                workoutPhase = 'ready';
                renderCurrentSet();
            }
        });

        // Rest time adjustments
        document.querySelectorAll('.rest-adjust-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const seconds = parseInt(btn.dataset.seconds, 10);
                lastRestDuration = seconds;
                clearRestTimer();
                startRestTimerCountdown(seconds);
            });
        });

        // Finish workout from rest phase (freestyle)
        document.getElementById('freestyle-finish-from-rest-btn')?.addEventListener('click', () => {
            clearRestTimer();
            workoutPhase = 'done';
            renderCurrentSet();
        });

        // Add extra set
        document.getElementById('add-extra-set-btn')?.addEventListener('click', () => {
            const exercise = currentWorkout.exercises[currentExIndex];
            const type = exercise.type || 'weighted';
            exercise.sets.push(createEmptySet(type));
            renderCurrentSet();
        });

        // Previous set
        document.getElementById('prev-set-btn')?.addEventListener('click', () => {
            clearRestTimer();
            stopActiveStopwatch();
            goToPreviousSet();
            workoutPhase = 'ready';
            renderCurrentSet();
        });

        // Skip Set
        document.getElementById('skip-set-btn')?.addEventListener('click', () => {
            clearRestTimer();
            stopActiveStopwatch();
            const exercise = currentWorkout.exercises[currentExIndex];
            const isLastSetOfExercise = currentSetIndex >= exercise.sets.length - 1;
            if (isFreestyle && isLastSetOfExercise) {
                workoutPhase = 'add_exercise';
            } else if (isAtLastSet()) {
                workoutPhase = 'done';
            } else {
                advanceToNextSet();
                workoutPhase = 'ready';
            }
            renderCurrentSet();
        });

        // Copy Previous
        document.getElementById('copy-previous-btn')?.addEventListener('click', () => {
            copyPreviousWorkout();
        });

        // Cancel Workout
        document.getElementById('cancel-workout-nav-btn')?.addEventListener('click', () => {
            if (confirm('Cancel this workout? All progress will be lost.')) {
                currentWorkout = null;
                isFreestyle = false;
                clearWorkoutTimer();
                clearRestTimer();
                stopActiveStopwatch();
                showSection('routines');
            }
        });
    }

    function saveCurrentInputs() {
        const set = currentWorkout.exercises[currentExIndex].sets[currentSetIndex];
        const weightInput = document.getElementById('guided-weight');
        const repsInput = document.getElementById('guided-reps');
        const distanceInput = document.getElementById('guided-distance');

        if (weightInput) set.weight = weightInput.value;
        if (repsInput) set.reps = repsInput.value;
        if (distanceInput) set.distance = distanceInput.value;
    }

    function completeCurrentSet() {
        workoutPhase = 'resting';
        startRestTimerCountdown(lastRestDuration);
        renderCurrentSet();
    }

    function isAtLastSet() {
        if (currentExIndex >= currentWorkout.exercises.length - 1) {
            const lastExercise = currentWorkout.exercises[currentWorkout.exercises.length - 1];
            if (currentSetIndex >= lastExercise.sets.length - 1) {
                return true;
            }
        }
        return false;
    }

    function advanceToNextSet() {
        const exercise = currentWorkout.exercises[currentExIndex];
        if (currentSetIndex < exercise.sets.length - 1) {
            currentSetIndex++;
        } else if (currentExIndex < currentWorkout.exercises.length - 1) {
            currentExIndex++;
            currentSetIndex = 0;
        }
    }

    function goToPreviousSet() {
        if (currentSetIndex > 0) {
            currentSetIndex--;
        } else if (currentExIndex > 0) {
            currentExIndex--;
            currentSetIndex = currentWorkout.exercises[currentExIndex].sets.length - 1;
        }
    }

    // --- Active Stopwatch (for timed exercises during in_set phase) --- //

    function startActiveStopwatch() {
        const set = currentWorkout.exercises[currentExIndex].sets[currentSetIndex];
        const baseDuration = set.duration || 0;
        activeStopwatchStart = Date.now();

        activeStopwatchInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - activeStopwatchStart) / 1000);
            const display = document.getElementById('stopwatch-display');
            if (display) {
                display.textContent = formatDuration(baseDuration + elapsed);
            }
        }, 250);
    }

    function stopActiveStopwatch() {
        if (activeStopwatchInterval) {
            clearInterval(activeStopwatchInterval);
            if (activeStopwatchStart && currentWorkout) {
                const elapsed = Math.floor((Date.now() - activeStopwatchStart) / 1000);
                const set = currentWorkout.exercises[currentExIndex].sets[currentSetIndex];
                set.duration = (set.duration || 0) + elapsed;
            }
            activeStopwatchInterval = null;
            activeStopwatchStart = null;
        }
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

    // --- Rest Timer (integrated into resting phase) --- //

    function startRestTimerCountdown(seconds) {
        clearRestTimer();
        restTimerPaused = false;
        restTimerEndTime = Date.now() + seconds * 1000;
        restTimeRemaining = seconds;

        restTimerInterval = setInterval(() => {
            if (!restTimerPaused) {
                const remaining = Math.round((restTimerEndTime - Date.now()) / 1000);
                restTimeRemaining = Math.max(0, remaining);
                const display = document.getElementById('rest-display');
                if (display) {
                    display.textContent = formatDuration(restTimeRemaining);
                }
                if (restTimeRemaining <= 0) {
                    clearInterval(restTimerInterval);
                    restTimerInterval = null;
                    restTimerEndTime = null;
                    notifyRestComplete();
                    if (display) display.textContent = "0:00";
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
        restTimerEndTime = null;
    }

    // When the app returns to the foreground, sync the timer and catch expired timers
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && restTimerEndTime && !restTimerPaused) {
            const remaining = Math.round((restTimerEndTime - Date.now()) / 1000);
            if (remaining <= 0) {
                // Timer expired while in background
                clearInterval(restTimerInterval);
                restTimerInterval = null;
                restTimerEndTime = null;
                restTimeRemaining = 0;
                const display = document.getElementById('rest-display');
                if (display) display.textContent = "0:00";
                notifyRestComplete();
            } else {
                restTimeRemaining = remaining;
                const display = document.getElementById('rest-display');
                if (display) display.textContent = formatDuration(restTimeRemaining);
            }
        }
    });

    function notifyRestComplete() {
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
        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
        }
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


    // --- Finish Workout --- //

    async function finishWorkout() {
        if (!currentWorkout) return;

        stopActiveStopwatch();

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
            alert(`Workout saved!\nDuration: ${durationStr}`);
            currentWorkout = null;
            isFreestyle = false;
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

        currentWorkout.exercises.forEach((exercise) => {
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

        renderCurrentSet();
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
                <label class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                    <input type="checkbox" value="${ex}" class="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" ${isChecked ? 'checked' : ''}>
                    <span class="text-sm font-medium">${ex}</span>
                </label>
            `;
        });
        exerciseModal.classList.remove('hidden');
        exerciseModal.style.display = 'flex';
    });

    cancelExerciseSelectBtn.addEventListener('click', () => {
        exerciseModal.classList.add('hidden');
        exerciseModal.style.display = '';
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
        exerciseModal.style.display = '';
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

        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const workoutsThisWeek = workouts.filter(w => new Date(w.date) > oneWeekAgo).length;
        workoutsThisWeekEl.textContent = workoutsThisWeek;

        oneRepMaxUnitEl.textContent = `(${weightUnit})`;

        const { data: profile } = await supabase.from('profiles').select('dashboard_exercises').eq('user_id', currentUser.id).single();
        const savedExercises = profile.dashboard_exercises || [];

        oneRepMaxExerciseNames.forEach((nameEl, i) => {
            const exerciseName = savedExercises[i];
            if (exerciseName) {
                nameEl.textContent = exerciseName;
                calculateAndDisplayOneRepMax(exerciseName, i, workouts);
            } else {
                nameEl.textContent = 'Select';
                oneRepMaxValues[i].textContent = '-';
            }
        });

        renderWeeklyVolumeChart(workouts);
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
        let datasetColor = 'rgba(99, 102, 241, 1)';
        let datasetBg = 'rgba(99, 102, 241, 0.1)';

        if (type === 'timed' || type === 'timed_weighted') {
            chartLabel = `Max Duration (seconds)`;
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
            datasetColor = 'rgba(168, 85, 247, 1)';
            datasetBg = 'rgba(168, 85, 247, 0.1)';
        } else if (type === 'cardio') {
            chartLabel = `Distance`;
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
            datasetColor = 'rgba(245, 158, 11, 1)';
            datasetBg = 'rgba(245, 158, 11, 0.1)';
        } else if (type === 'reps_only' || type === 'bodyweight') {
            chartLabel = `Max Reps`;
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
            datasetColor = 'rgba(16, 185, 129, 1)';
            datasetBg = 'rgba(16, 185, 129, 0.1)';
        } else {
            chartLabel = `Estimated 1RM`;
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
                    tension: 0.4,
                    pointBackgroundColor: datasetColor,
                    pointRadius: 4,
                    pointHoverRadius: 6,
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

        const type = getExerciseTypeFromWorkouts(exerciseName, workouts);
        if (type !== 'weighted' && type !== 'bodyweight') {
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
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    borderColor: 'rgba(99, 102, 241, 1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: 'rgba(99, 102, 241, 1)',
                    pointRadius: 4,
                    pointHoverRadius: 6,
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
                return `BW × ${set.reps} reps`;
            case 'reps_only':
                return `${set.reps} reps`;
            case 'weighted':
            default:
                return `${convertWeight(set.weight, weightUnit)} ${weightUnit} × ${set.reps} reps`;
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

        const emptyState = document.getElementById('history-empty-state');
        historyList.innerHTML = '';

        if (workouts.length === 0) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
            workouts.forEach(workout => {
                const div = document.createElement('div');
                div.className = 'card bg-white dark:bg-gray-900 p-4';
                const workoutDate = new Date(workout.date).toLocaleString();
                const exerciseCount = workout.exercises ? workout.exercises.length : 0;

                div.innerHTML = `
                    <div class="flex justify-between items-center cursor-pointer view-workout-details-btn" data-id="${workout.id}">
                        <div class="flex-1 min-w-0 pointer-events-none">
                            <h3 class="font-bold truncate">${workout.routine_name}</h3>
                            <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">${workoutDate} · ${exerciseCount} exercises</p>
                        </div>
                        <div class="flex items-center gap-2 ml-3">
                            <button class="delete-workout-btn p-2 text-gray-400 hover:text-red-500 transition-colors" data-id="${workout.id}" title="Delete">
                                <svg class="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                            </button>
                            <svg class="w-5 h-5 text-gray-300 dark:text-gray-600 pointer-events-none chevron-icon transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                        </div>
                    </div>
                    <div class="workout-details hidden mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                        ${workout.exercises.map(ex => {
                            const type = ex.type || (ex.bodyweight ? 'bodyweight' : 'weighted');
                            const typeLabel = EXERCISE_TYPES[type]?.label || '';
                            const suffix = type !== 'weighted' ? ` (${typeLabel})` : '';
                            return `
                                <div class="mb-3">
                                    <h5 class="font-semibold text-sm">${ex.name}<span class="text-xs text-gray-400 font-normal">${suffix}</span></h5>
                                    <div class="mt-1 space-y-0.5">
                                        ${ex.sets.map((set, i) => `<p class="text-xs text-gray-500 dark:text-gray-400 pl-2">Set ${i + 1}: ${formatSetDisplay(set, type)}</p>`).join('')}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `;
                historyList.appendChild(div);
            });
        }
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
            const card = target.closest('.card');
            const details = card.querySelector('.workout-details');
            const chevron = card.querySelector('.chevron-icon');
            if (details) {
                details.classList.toggle('hidden');
                if (chevron) {
                    chevron.style.transform = details.classList.contains('hidden') ? '' : 'rotate(180deg)';
                }
            }
        }

        if (target.classList.contains('delete-workout-btn')) {
            e.stopPropagation();
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

    async function loadUserProfile() {
        if (!currentUser) return;

        const { data: profile } = await supabase
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

        const { data: profile } = await supabase
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
            alert('Profile saved!');
            showSection('dashboard');
        }
    });

    // Initial Load
    checkUser();
});
