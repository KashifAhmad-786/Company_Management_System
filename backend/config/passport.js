const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const { sendOtpEmail } = require('../services/emailService');

const isGoogleConfigured = 
  process.env.GOOGLE_CLIENT_ID && 
  process.env.GOOGLE_CLIENT_ID !== 'your_google_client_id.apps.googleusercontent.com' &&
  process.env.GOOGLE_CLIENT_SECRET &&
  process.env.GOOGLE_CLIENT_SECRET !== 'your_google_client_secret';

if (isGoogleConfigured) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
        proxy: true,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails[0].value;
          const googleId = profile.id;
          const name = profile.displayName;

          // 1. Check if user already exists with this googleId
          let user = await User.findOne({ googleId });

          if (!user) {
            // 2. Check if user exists with this email (signed up with local before)
            user = await User.findOne({ email });

            if (user) {
              // Link Google account
              user.googleId = googleId;
              user.provider = 'google';
              await user.save();
            } else {
              // 3. Create new Google user (unverified by default per requirements)
              const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
              const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

              user = new User({
                name,
                email,
                provider: 'google',
                googleId,
                role: 'employee',
                isVerified: false,
                otpCode,
                otpExpiresAt,
              });
              await user.save();

              // Send OTP email
              await sendOtpEmail(email, otpCode);
            }
          } else {
            // If they are not verified, send a fresh OTP to let them verify
            if (!user.isVerified) {
              const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
              const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
              user.otpCode = otpCode;
              user.otpExpiresAt = otpExpiresAt;
              await user.save();

              await sendOtpEmail(user.email, otpCode);
            }
          }

          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
} else {
  console.log('[Passport Config] Google OAuth NOT configured. Strategy skipped.');
}

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
