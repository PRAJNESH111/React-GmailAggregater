import fs from "fs/promises";
import path from "path";
import { google } from "googleapis";
import dotenv from "dotenv";
dotenv.config();

const DATA_FILE = path.join(process.cwd(), "backend", "users.json");

async function readUsersFile() {
  try {
    const txt = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(txt || "[]");
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

async function writeUsersFile(users) {
  await fs.writeFile(DATA_FILE, JSON.stringify(users, null, 2), "utf8");
}

// Save user by fetching profile info from Google using the provided access token.
export async function saveUser(accessToken) {
  try {
    // Create an OAuth2 client with configured client id/secret so Google APIs accept the request
    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.REDIRECT_URI
    );
    client.setCredentials({ access_token: accessToken });
    const oauth2 = google.oauth2({ auth: client, version: "v2" });
    const resp = await oauth2.userinfo.get();
    const profile = resp.data;

    const users = await readUsersFile();
    // If user already exists (by id or email), update token
    const existingIndex = users.findIndex(
      (u) => u.id === profile.id || u.email === profile.email
    );
    const userRecord = {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      picture: profile.picture,
      access_token: accessToken,
      savedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      users[existingIndex] = { ...users[existingIndex], ...userRecord };
    } else {
      users.push(userRecord);
    }

    await writeUsersFile(users);
    // Return public-safe user info (do not return token in list endpoints normally)
    return {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      picture: userRecord.picture,
    };
  } catch (err) {
    console.error("saveUser error:", err?.message || err);
    // rethrow to let route handler respond with 500 and frontend see error details in console
    throw new Error(`Failed to get Google profile: ${err?.message || err}`);
  }
}

export async function listUsers() {
  const users = await readUsersFile();
  // Return without tokens
  return users.map(({ id, name, email, picture, savedAt }) => ({
    id,
    name,
    email,
    picture,
    savedAt,
  }));
}

export async function deleteUserById(userId) {
  const users = await readUsersFile();
  const idx = users.findIndex((x) => x.id === userId || x.email === userId);
  if (idx === -1) return false;
  users.splice(idx, 1);
  await writeUsersFile(users);
  return true;
}

export async function getUserTokenById(userId) {
  const users = await readUsersFile();
  const u = users.find((x) => x.id === userId || x.email === userId);
  return u?.access_token || null;
}

export default { saveUser, listUsers, getUserTokenById };
