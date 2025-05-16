import TokenBlacklist from '../models/tokenBlacklist';
import cron from 'node-cron';
import logger from '../utils/logger';



export const cleanBlacklist = () => {
  cron.schedule('0 0 * * *', async () => {
    try {
      await TokenBlacklist.deleteMany({ expiresAt: { $lt: new Date() } });
      logger.info('Expired tokens removed from blacklist');
    } catch (error: any) {
      logger.error(`Blacklist cleanup error: ${error.message}`);
    }
  });
};