// models/GeneralInquiry.js

import mongoose from 'mongoose';

const GeneralInquirySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    contact: { // Based on your sample data, this is the phone field
        type: String,
        required: true,
        trim: true
    },
    location: {
        type: String,
        trim: true
    },
    message: {
        type: String,
        trim: true
    }
}, { timestamps: true }); // Adds createdAt and updatedAt automatically

// Model name MUST match the collection name exactly: 'general_inquiries'
// const GeneralInquiry = mongoose.model('general_inquiries', GeneralInquirySchema);

export default GeneralInquirySchema;