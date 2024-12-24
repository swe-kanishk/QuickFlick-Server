import sharp from "sharp";
import cloudinary from "../utils/cloudinary.js";
import { Story } from "../models/Story.js";
import { User } from "../models/user.model.js";

// Add a new story
export const postStories = async (req, res) => {
    console.log(req)
    try {
        const { caption } = req.body;
        const image = req.file;
        const author = req.userId;

        if (!image) return res.status(400).json({ message: 'Image required' });

        // Resize and optimize the image
        const optimizedImageBuffer = await sharp(image.buffer)
            .resize({ width: 800, height: 800, fit: 'inside' })
            .toFormat('jpeg', { quality: 80 })
            .toBuffer();

        // Upload the image to Cloudinary
        const fileUri = `data:image/jpeg;base64,${optimizedImageBuffer.toString('base64')}`;
        const cloudResponse = await cloudinary.uploader.upload(fileUri);

        const imageUrl = cloudResponse.secure_url;

        // // Create a new story object
        const story = new Story({
            user: req.userId,
            author,
            caption,
            image: [imageUrl],
        });

        // // Save the story
        await story.save();

        // // Optionally, update user info if needed (assuming you're tracking stories for the user)
        const user = await User.findById(author);
        if (user) {
            // If you're tracking user stories, you can push the story _id into a user field like 'stories'
            user.stories.push(story._id);
            await user.save();
        }

        // // Populate the 'author' field in the story response
        await story.populate({ path: 'author', select: '-password' });

        return res.status(201).json({
            message: 'Story added successfully!',
            story,
            success: true,
        });
    } catch (error) {
        console.error(error); // Log the error for debugging
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get active stories (for a user and their followers)
export const getStories = async (req, res) => {
    console.log(req.params)
    try {
      const { userId } = req.params;
  
      const stories = await Story.find({
        author: userId,
        expiryTime: { $gt: new Date() }, // Only fetch non-expired stories
      })
  
      res.status(200).json({ success: true, stories });
    } catch (error) {
      console.error(error); // Log the error for debugging
      res.status(500).json({ success: false, message: error.message });
    }
  };
  