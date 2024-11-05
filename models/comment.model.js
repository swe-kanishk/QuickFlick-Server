import { Schema, model } from "mongoose";

const commentSchema = new Schema({
    text: {
        type: String,
        required: true
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    post : {
        type: Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    }
}, {timestamps: true})

export const Comment = model('Comment', commentSchema);