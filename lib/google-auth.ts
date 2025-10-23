import { google } from 'googleapis'

export const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback'
)

// Generate Google OAuth URL
export function getGoogleAuthUrl() {
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ]

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  })
}

// Get user info from Google
export async function getGoogleUserInfo(code: string) {
  try {
    console.log('🔑 Exchanging code for tokens...')
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code)
    console.log('✅ Tokens received')
    
    oauth2Client.setCredentials(tokens)

    // Get user info
    console.log('👤 Fetching user info...')
    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: 'v2',
    })

    const { data } = await oauth2.userinfo.get()
    console.log('✅ User info received:', { email: data.email, name: data.name })
    
    return {
      email: data.email,
      name: data.name,
      picture: data.picture,
      googleId: data.id,
    }
  } catch (error: any) {
    console.error('❌ Error getting Google user info:', error)
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data
    })
    throw error
  }
}
