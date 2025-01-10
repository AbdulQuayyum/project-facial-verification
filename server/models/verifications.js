import mongoose from "mongoose";
const { Schema } = mongoose;

const VerficationsSchema = new Schema({
    matricNumber: {
        type: String,
        required: true,
        match: /^\d{2}\d{2}[A-Z]{2}\d{3}$/ 
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    verificationStatus: {
        type: String,
        enum: ['success', 'failure'],
        required: true
    },
    confidenceScore: {
        type: Number,
        required: true
    },
    similarityScore: {
        type: Number,
        required: true
    },
    livenessDetails: {
        blinkCount: Number,
        detectionCount: Number
    },
    imageUrl: {
        type: String,
        required: true
    },
    ipAddress: String,
    userAgent: String,
    errorMessage: String,
    processingTime: Number
});

export default mongoose.model('Verifications', VerficationsSchema);