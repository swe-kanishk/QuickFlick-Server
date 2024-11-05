import { Conversation } from "../models/conversation.model.js";
import { Message } from "../models/message.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";

export const sendMessage = async(req, res) => {
    try {
        const senderId = req.id;
        const receiverId = req.params.id;
        const {textMessage: message} = req.body;

        let conversation = await Conversation.findOne({
            participants: {$all: [senderId, receiverId]}
        });
        if(!conversation) {
            conversation = await Conversation.create({
                participants: [senderId, receiverId]
            });
        };
        const newMessage = await Message.create({
            receiverId,
            senderId,
            message,
        });
        if(newMessage) conversation.messages.push(newMessage._id);
        await Promise.all([conversation.save(), newMessage.save()]);

        const recieverSocketId = getReceiverSocketId(receiverId);

        if(recieverSocketId) {
            console.log(newMessage)
            console.log('hello ji')
            io.to(recieverSocketId).emit('newMessage', newMessage)
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
        const senderId = req.id;
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