// lib/google-auth.ts
import { google } from "googleapis";

export const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/auth/google/callback"
);

// Generate Google OAuth URL (tanpa consent/validasi ulang)
export function getGoogleAuthUrl(opts?: { selectAccount?: boolean; loginHint?: string }) {
  const scopes = [
    "openid", // biar dapat id_token
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
  ];

  const params: any = {
    scope: scopes,
    include_granted_scopes: true,
    // TIDAK pakai prompt=consent → setelah pilih akun langsung balik ke app
    // Jangan set access_type=offline agar tidak minta refresh token (dan tak munculkan konfirmasi awal)
  };

  // tetap munculkan pemilih akun (kalau mau langsung skip juga, hapus baris ini)
  if (opts?.selectAccount ?? true) params.prompt = "select_account";
  if (opts?.loginHint) params.login_hint = opts.loginHint;

  return oauth2Client.generateAuthUrl(params);
}

// Get user info from Google
export async function getGoogleUserInfo(code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  const oauth2 = google.oauth2({ auth: oauth2Client, version: "v2" });
  const { data } = await oauth2.userinfo.get();

  return {
    email: data.email,
    name: data.name,
    picture: data.picture,
    googleId: data.id,
  };
}
