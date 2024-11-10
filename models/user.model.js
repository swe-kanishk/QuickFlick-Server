import { Schema, model } from "mongoose";

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    avatar: {
        type: String,
        default: ''
    },
    bio: {
        type: String,
        default: ''
    },
    gender: {
        type: String,
        enum: ['male', 'female']
    },
    follower: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    isDark: {
        type: Boolean,
        default: false
    },
    following: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    stories: [{
        type: Schema.Types.ObjectId,
        ref: 'Story'
    }],
    archieveStories: [{ 
        type: Schema.Types.ObjectId,
        ref: 'Story'
    }],
    posts: [{
        type: Schema.Types.ObjectId,
        ref: 'Post'
    }],
    saved: [{
        type: Schema.Types.ObjectId,
        ref: 'Post'
    }],
    lastLogin: {
        type: Date,
        default: Date.now
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    resetPasswordToken: String,
    resetPasswordExpiresAt: Date,
    verificationToken: String,
    verificationTokenExpiresAt: Date,
}, {timestamps: true});

export const User = model('User', userSchema);