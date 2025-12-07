import { clearLocalAuth, refreshToken } from "./auth";

export const API_URL = "http://localhost:5035";

export async function apiRequest(
  path: string,
  method = "GET",
  body?: any,
  token?: string
) {
  async function makeRequest(accessToken?: string) {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    let data = null;
    try {
      data = await res.json();
    } catch {}

    return { res, data };
  }

  // 1️⃣ — pirmas bandymas
  const { res, data } = await makeRequest(token);

  // 2️⃣ — jei 401 → bandome atnaujinti token
  if (res.status === 401) {
    try {
      const newAccessToken = await refreshToken();

      // 3️⃣ — pakartojame requestą su nauju tokenu
      const retry = await makeRequest(newAccessToken);

      if (!retry.res.ok) {
        throw new Error(retry.data?.message || "Request failed");
      }

      return retry.data;
    } catch (err) {
      // jei refresh fail — vartotojas turi prisijungti iš naujo
      clearLocalAuth();
      throw new Error("Session expired. Please login again.");
    }
  }

  // 4️⃣ — jei ne 401, bet vis tiek klaida
  if (!res.ok) {
  let message = "Request failed";

  if (data) {
    if (typeof data === "string") {
      message = data;
    } else if (typeof data === "object") {
      message =
        data.message ||
        data.detail ||
        data.title ||
        JSON.stringify(data);
    }
  }

  throw new Error(message + ` (status: ${res.status})`);
}


  return data;
}

export async function getMyProfile() {
  return apiRequest("/api/users/me", "GET");
}

export async function deleteUser(username: string) {
  const token = localStorage.getItem("accessToken");
  return apiRequest(`/api/users/${username}`, "DELETE", null, token || undefined);
}

export async function updateUser(username: string, payload: any) {
  const token = localStorage.getItem("accessToken");

  return apiRequest(
    `/api/users/${username}`,
    "PUT",
    payload,
    token || undefined
  );
}

/* ----------------- TRAINER CLIENTS ----------------- */

export async function getMyClients() {
  const token = localStorage.getItem("accessToken");
  return apiRequest("/api/users/my-clients", "GET", null, token || undefined);
}

export async function addClientToTrainer(clientUsername: string) {
  const token = localStorage.getItem("accessToken");
  const trainerUsername = localStorage.getItem("username");

  if (!token || !trainerUsername) {
    throw new Error("Reikia prisijungti kaip treneriui.");
  }

  return apiRequest(
    `/api/users/${encodeURIComponent(
      trainerUsername
    )}/add-client/${encodeURIComponent(clientUsername)}`,
    "POST",
    null,
    token
  );
}

export async function removeClientFromTrainer(clientUsername: string) {
  const token = localStorage.getItem("accessToken");
  const trainerUsername = localStorage.getItem("username");

  if (!token || !trainerUsername) {
    throw new Error("Reikia prisijungti kaip treneriui.");
  }

  return apiRequest(
    `/api/users/${encodeURIComponent(
      trainerUsername
    )}/remove-client/${encodeURIComponent(clientUsername)}`,
    "DELETE",
    null,
    token
  );
}
// --- TRAINERS (naudotojams) ---

// Gauti visus trenerius (tik prisijungus)
export async function getTrainers() {
  const token = localStorage.getItem("accessToken");
  return apiRequest("/api/users/trainers", "GET", null, token || undefined);
}

/* ----------------- TRAINER CLIENT SEARCH ----------------- */

export async function searchClients(query: string) {
  const token = localStorage.getItem("accessToken");

  return apiRequest(
    `/api/users/search?query=${encodeURIComponent(query)}`,
    "GET",
    null,
    token || undefined
  );
}

/* ----------------- TRAINING PLANS ----------------- */

// Visų planų sąrašas
export async function getTrainingPlans() {
  const token = localStorage.getItem("accessToken");
  return apiRequest("/api/trainingplans", "GET", null, token || undefined);
}

// Gauti konkretų planą
export async function getTrainingPlan(id: number) {
  const token = localStorage.getItem("accessToken");
  return apiRequest(
    `/api/trainingplans/${id}`,
    "GET",
    null,
    token || undefined
  );
}

// Ištrinti planą
export async function deleteTrainingPlan(id: number) {
  const token = localStorage.getItem("accessToken");
  return apiRequest(
    `/api/trainingplans/${id}`,
    "DELETE",
    null,
    token || undefined
  );
}

// Sukurti treniruočių planą (workoutIds – neprivalomas sąrašas treniruočių ID)
export async function createTrainingPlan(
  body: any,
  token: string,
  workoutIds?: number[]
) {
  const query =
    workoutIds && workoutIds.length > 0
      ? "?" + workoutIds.map((id) => `workoutIds=${id}`).join("&")
      : "";

  return apiRequest(`/api/trainingplans${query}`, "POST", body, token);
}

// Atnaujinti treniruočių planą
export async function updateTrainingPlan(
  id: number,
  body: any,
  token: string,
  workoutIds?: number[]
) {
  const query =
    workoutIds && workoutIds.length > 0
      ? "?" + workoutIds.map((wid) => `workoutIds=${wid}`).join("&")
      : "";

  return apiRequest(`/api/trainingplans/${id}${query}`, "PUT", body, token);
}

// Gauti plano treniruotes
export async function getTrainingPlanWorkouts(planId: number) {
  const token = localStorage.getItem("accessToken");
  return apiRequest(
    `/api/trainingplans/${planId}/workouts`,
    "GET",
    null,
    token || undefined
  );
}

// Gauti konkretaus plano įvertinimo santrauką (palieku, kaip jau sutvarkyta)
export async function getTrainingPlanRating(planId: number) {
  const token = localStorage.getItem("accessToken");

  const data = await apiRequest(
    `/api/trainingplans/${planId}/rating`,
    "GET",
    null,
    token || undefined
  );

  if (!data || typeof data !== "object") {
    return {
      averageScore: 0,
      ratingsCount: 0,
      userScore: null,
    };
  }

  const averageScore = data.averageScore ?? data.AverageScore ?? 0;
  const ratingsCount = data.ratingsCount ?? data.RatingsCount ?? 0;
  const userScore = data.userScore ?? data.UserScore ?? null;

  return {
    averageScore,
    ratingsCount,
    userScore,
  };
}

export async function getTopRatedPlans() {
  return apiRequest("/api/trainingplans/top-rated", "GET");
}

/* ----------------- TRAINING PLAN RATINGS ----------------- */

// Įvertinti treniruočių planą
export async function rateTrainingPlan(planId: number, score: number) {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    throw new Error("Reikia prisijungti, kad įvertintum treniruočių planą.");
  }

  return apiRequest(
    `/api/trainingplans/${planId}/rating`,
    "POST",
    { score },
    token
  );
}

// Nuimti savo įvertinimą nuo plano
export async function deleteTrainingPlanRating(planId: number) {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    throw new Error("Reikia prisijungti, kad nuimtum plano įvertinimą.");
  }

  return apiRequest(
    `/api/trainingplans/${planId}/rating`,
    "DELETE",
    null,
    token
  );
}

/* ----------------- TRAINING PLAN COMMENTS ----------------- */

export async function getTrainingPlanComments(planId: number) {
  const token = localStorage.getItem("accessToken");

  return apiRequest(
    `/api/comments/plan/${planId}`,
    "GET",
    null,
    token || undefined
  );
}

export async function createTrainingPlanComment(planId: number, text: string) {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    throw new Error("Reikia prisijungti, kad pakomentuotum planą.");
  }

  return apiRequest(
    `/api/comments`,
    "POST",
    { text, trainingPlanId: planId },
    token
  );
}

/* ----------------- WORKOUTS ----------------- */

// Gauti visas treniruotes (atsižvelgiant į vartotoją / rolę)
export async function getWorkouts() {
  const token = localStorage.getItem("accessToken");
  return apiRequest("/api/workouts", "GET", null, token || undefined);
}

// Gauti konkrečią treniruotę
export async function getWorkout(id: number) {
  const token = localStorage.getItem("accessToken");
  return apiRequest(
    `/api/workouts/${id}`,
    "GET",
    null,
    token || undefined
  );
}

// Sukurti treniruotę (planIds – neprivalomas sąrašas planų ID)
export async function createWorkout(
  body: any,
  token: string,
  planIds?: number[]
) {
  const query =
    planIds && planIds.length > 0
      ? "?" + planIds.map((id) => `planIds=${id}`).join("&")
      : "";

  return apiRequest(`/api/workouts${query}`, "POST", body, token);
}

// Atnaujinti treniruotę
export async function updateWorkout(
  id: number,
  body: any,
  token: string,
  planIds?: number[]
) {
  const query =
    planIds && planIds.length > 0
      ? "?" + planIds.map((pid) => `planIds=${pid}`).join("&")
      : "";

  return apiRequest(`/api/workouts/${id}${query}`, "PUT", body, token);
}

// Ištrinti treniruotę
export async function deleteWorkout(id: number) {
  const token = localStorage.getItem("accessToken");
  return apiRequest(
    `/api/workouts/${id}`,
    "DELETE",
    null,
    token || undefined
  );
}

// Gauti treniruotės pratimus
export async function getWorkoutExercises(workoutId: number) {
  const token = localStorage.getItem("accessToken");
  return apiRequest(
    `/api/workouts/${workoutId}/exercises`,
    "GET",
    null,
    token || undefined
  );
}

// Pridėti pratimus prie treniruotės
export async function addExercisesToWorkout(
  workoutId: number,
  exerciseIds: number[],
  token: string
) {
  const query =
    exerciseIds && exerciseIds.length > 0
      ? "?" + exerciseIds.map((id) => `exerciseIds=${id}`).join("&")
      : "";

  return apiRequest(
    `/api/workouts/${workoutId}/add-exercises${query}`,
    "POST",
    null,
    token
  );
}

// Pašalinti pratimus iš treniruotės
export async function removeExercisesFromWorkout(
  workoutId: number,
  exerciseIds: number[],
  token: string
) {
  const query =
    exerciseIds && exerciseIds.length > 0
      ? "?" + exerciseIds.map((id) => `exerciseIds=${id}`).join("&")
      : "";

  return apiRequest(
    `/api/workouts/${workoutId}/exercises${query}`,
    "DELETE",
    null,
    token
  );
}

/* ----------------- EXERCISES ----------------- */

export async function getExercises() {
  const token = localStorage.getItem("accessToken");

  return apiRequest("/api/exercises", "GET", null, token || undefined);
}

export async function getExercise(id: number) {
  const token = localStorage.getItem("accessToken");

  return apiRequest(
    `/api/exercises/${id}`,
    "GET",
    null,
    token || undefined
  );
}

export async function getExerciseTemplates() {
  return apiRequest("/api/exercisetemplates", "GET");
}

export async function createExercise(body: any, token: string) {
  return apiRequest("/api/exercises", "POST", body, token);
}

export async function updateExercise(id: number, body: any, token: string) {
  return apiRequest(`/api/exercises/${id}`, "PUT", body, token);
}

export async function deleteExercise(id: number) {
  const token = localStorage.getItem("accessToken");

  return apiRequest(
    `/api/exercises/${id}`,
    "DELETE",
    null,
    token || undefined
  );
}

/* ----------------- WORKOUT RATINGS ----------------- */

export async function getWorkoutRating(workoutId: number) {
  const token = localStorage.getItem("accessToken");
  return apiRequest(
    `/api/workouts/${workoutId}/rating`,
    "GET",
    null,
    token || undefined
  );
}

export async function rateWorkout(workoutId: number, score: number) {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    throw new Error("Reikia prisijungti, kad įvertintum treniruotę.");
  }

  return apiRequest(
    `/api/workouts/${workoutId}/rating`,
    "POST",
    { score },
    token
  );
}

export async function deleteWorkoutRating(workoutId: number) {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    throw new Error("Reikia prisijungti, kad nuimtum įvertinimą.");
  }

  return apiRequest(
    `/api/workouts/${workoutId}/rating`,
    "DELETE",
    null,
    token
  );
}

/* ----------------- WORKOUT COMMENTS ----------------- */

export async function getWorkoutComments(workoutId: number) {
  const token = localStorage.getItem("accessToken");

  return apiRequest(
    `/api/comments/workout/${workoutId}`,
    "GET",
    null,
    token || undefined
  );
}

export async function createWorkoutComment(workoutId: number, text: string) {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    throw new Error("Reikia prisijungti, kad pakomentuotum.");
  }

  return apiRequest(
    `/api/comments`,
    "POST",
    { text, workoutId }, // JSON binder'is 'workoutId' → 'WorkoutId'
    token
  );
}

export async function deleteComment(commentId: number) {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    throw new Error("Reikia prisijungti.");
  }

  return apiRequest(`/api/comments/${commentId}`, "DELETE", null, token);
}