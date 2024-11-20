import { Conversation } from "../models/conversation.model.js";
import { Message } from "../models/message.model.js";
import { User } from "../models/user.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";

export const sendMessage = async (req, res) => {
    try {
        const senderId = req.userId;
        const receiverId = req.params.id;
        const { textMessage: message } = req.body;

        // Find the conversation between sender and receiver
        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] }
        }).populate('participants', 'username avatar'); // Populate username and avatar


        // // Create a new conversation if it doesn't exist
        if (!conversation) {
            conversation = await Conversation.create({
                participants: [senderId, receiverId]
            });
            await conversation.populate('participants', 'username avatar'); // Populate for new conversation
        }

        // // Create a new message
        const newMessage = await Message.create({
            receiverId,
            senderId,
            message,
        });

        // // Add the new message to the conversation
        if (newMessage) {
            conversation.messages.push(newMessage._id);
        }

        // // Save both conversation and message
        await Promise.all([conversation.save(), newMessage.save()]);

        // // Get receiver's socket ID for real-time notification
        const recieverSocketId = getReceiverSocketId(receiverId);

        const sender = await User.findById(req.userId).select('-password')

        if (recieverSocketId) {
            io.to(recieverSocketId).emit('newMessage', {
                ...newMessage._doc,
                sender: {
                    id: senderId,
                    username: sender.username,
                    avatar: sender.avatar
                }
            });
        }

        return res.status(201).json({
            success: true,
            newMessage
        })
    } catch (error) {
        console.log(error)
    }
}

export const getMessage = async (req, res) => {
    try {
        const senderId = req.userId;
        const receiverId = req.params.id;
        const conversation = await Conversation.findOne({
            participants: {$all: [senderId, receiverId]}
        }).populate('messages');
        if(!conversation) return res.status(200).json({success: true, messages: []});
        return res.status(200).json({success: true, messages: conversation?.messages});
    } catch (error) {
        console.log(error)
    }
}