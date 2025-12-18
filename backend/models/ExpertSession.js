// models/ExpertSession.js

import mongoose from 'mongoose';

const ExpertSessionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    contact: { // Based on your sample data, this is the contact field
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    date: {
        type: String, // Sticking to String type as per your sample data "July 14, 2025"
        trim: true
    },
    time: {
        type: String, // Sticking to String type as per your sample data "11:30 am"
        trim: true
    }
}, { timestamps: true }); // Adds createdAt and updatedAt automatically

// Model name MUST match the collection name exactly: 'expert_session_bookings'
// const ExpertSession = mongoose.model('expert_session_bookings', ExpertSessionSchema);

export default ExpertSessionSchema;