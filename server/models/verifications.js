import mongoose from 'mongoose';

const schema = new mongoose.Schema({
    matricNumber: {
        type: String,
        required: true
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
    storedImageUrl: { type: String },
    capturedImageBase64: { type: String },
    ipAddress: String,
    userAgent: String,
    errorMessage: String,
    processingTime: Number
});

const VerificationSchema = mongoose.model('Verifications', schema);

export default VerificationSchema;