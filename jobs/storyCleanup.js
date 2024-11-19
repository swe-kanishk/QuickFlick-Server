import cron from "node-cron";
import { Story } from "../models/Story.js";
import { User } from "../models/user.model.js"

export const cleanupExpiredStories = () => {
  cron.schedule("0 * * * *", async () => {
    console.log(`Cron job started at ${new Date().toISOString()}`);

    try {
      const now = new Date();

      const expiredStories = await Story.find({ expiryTime: { $lte: now } });

      for (const story of expiredStories) {
        await User.updateMany(
          { $or: [{ stories: story._id }, { archieveStories: story._id }] },
          { $pull: { stories: story._id, archieveStories: story._id } }
        );

        await story.deleteOne();
      }

      console.log(
        `${expiredStories.length} expired stories cleaned up at ${new Date().toISOString()}`
      );
    } catch (error) {
      console.error("Error during expired stories cleanup:", error);
    }
  });
};
