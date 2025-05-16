import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import userModel from '../models/userModel';
import dotenv from 'dotenv';
import logger from '../utils/logger';


dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: `${process.env.APP_URL}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await userModel.findOne({ googleId: profile.id });
        if (!user) {
          user = await userModel.findOne({ email: profile.emails?.[0].value });
          if (user) {
            user.googleId = profile.id;
            await user.save();
            logger.info(`Linked Google account for existing user ${user.email}`);
          } else {
            user = new userModel({
              name: profile.displayName,
              email: profile.emails?.[0].value,
              googleId: profile.id,
              isVerified: true,
            });
            await user.save();
            logger.info(`Created new user ${user.email} via Google OAuth`);
          }
        }
        return done(null, user);
      } catch (error: any) {
        logger.error(`Google OAuth error: ${error.message}`);
        return done(error, false);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await userModel.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;