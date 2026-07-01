import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/user.models.js';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      proxy: true,   // ← ADD THIS — prevents redirect_uri mismatch behind Express proxy
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          if (!user.googleId) {
            // Use findOneAndUpdate rather than fetch+mutate+save: `.save()`
            // re-validates the WHOLE document, and password has
            // `select: false` so it wasn't loaded by the findOne above —
            // Mongoose would see password as "missing" and throw, even
            // though it's untouched. findOneAndUpdate only touches the
            // given paths.
            user = await User.findOneAndUpdate(
              { _id: user._id },
              { $set: { googleId: profile.id } },
              { new: true },
            );
          }
          return done(null, user);
        }

        user = await User.create({
          username: profile.displayName.replace(/\s+/g, '').toLowerCase() +
                   Math.floor(Math.random() * 1000),
          email: profile.emails[0].value,
          googleId: profile.id,
          authProvider: 'google', // makes the schema's conditional password requirement skip password
          profile: {
            avatar: profile.photos[0]?.value || '',
          },
          isEmailVerified: true,
        });

        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

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

export default passport;