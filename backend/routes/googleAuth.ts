import express from 'express';
import passport from '../middleware/googleAuth';
import { googleAuthCallback } from '../controllers/googleAuthController';

const router = express.Router();

router.get('/', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/callback', passport.authenticate('google', { session: false }), googleAuthCallback);


export default router;