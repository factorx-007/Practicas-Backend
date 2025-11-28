export const authConfig = {
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'tu-super-secreto-jwt-aqui',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'tu-refresh-secret-aqui',
    accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
    issuer: 'ProTalent',
    audience: 'ProTalent-Users'
  },

  // Password Configuration
  password: {
    saltRounds: 12,
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false
  },

  // Session Configuration
  session: {
    name: 'protalent-session',
    maxAge: 24 * 60 * 60 * 1000, // 24 horas
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const
  },

  // OAuth Configuration
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback'
  },

  // Email Verification
  email: {
    verificationTokenExpiry: '24h',
    resetPasswordTokenExpiry: '1h'
  }
};

export default authConfig;