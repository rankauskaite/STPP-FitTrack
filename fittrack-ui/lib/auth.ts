import { API_URL, apiRequest } from "./api";

// ---------- LOGIN ----------
export async function login(username: string, password: string) {
  const data = await apiRequest(
    "/api/auth/login",
    "POST",
    { username, password }
  );

  // Save everything returned by API
  localStorage.setItem("accessToken", data.accessToken);
  localStorage.setItem("refreshToken", data.refreshToken);
  localStorage.setItem("username", data.username);
  localStorage.setItem("role", data.role);
  document.cookie = `token=${data.accessToken}; path=/; max-age=${60 * 60 * 24}; sameSite=lax`;

  return data;
}

// ---------- REGISTER ----------
export async function signup(fullName: string, username: string, password: string) {
  const data = await apiRequest(
    "/api/users/register",
    "POST",
    { fullName, username, password }
  );

  // Save everything returned by API
  localStorage.setItem("accessToken", data.accessToken);
  localStorage.setItem("refreshToken", data.refreshToken);
  localStorage.setItem("username", data.username);
  localStorage.setItem("role", data.role);
  document.cookie = `token=${data.accessToken}; path=/; max-age=${60 * 60 * 24}; sameSite=lax`;

  return data; 
}

// ---------- GET PROFILE ----------
export async function getProfile() {
  const token = localStorage.getItem("accessToken");
  if (!token) return null;

  return await apiRequest(
    "/api/users/me",
    "GET",
    undefined,
    token
  );
}

// ---------- LOGOUT ----------
export async function logoutApi() {
  const refreshToken = localStorage.getItem("refreshToken");

  if (!refreshToken) return;

  try {
    await apiRequest(
      "/api/auth/logout",
      "POST",
      { refreshToken }
    );
  } catch {
    // If API fails, UI will still log out – it's safe to ignore
  }
}

// ---------- REFRESH TOKEN ----------
export async function refreshToken() {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) throw new Error("No refresh token");

  const data = await apiRequest(
    "/api/auth/refresh",
    "POST",
    { refreshToken }
  );

  // Išsaugome naujus tokenus
  localStorage.setItem("accessToken", data.accessToken);
  localStorage.setItem("refreshToken", data.refreshToken);

  return data.accessToken; // grąžinam, kad galėtume pakartoti requestą
}

export function clearLocalAuth() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("username");
  localStorage.removeItem("role");
  document.cookie = "token=; path=/; max-age=0; sameSite=lax";
}