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
        isLive: {
            type: Boolean,
            required: true
        },
        accuracy: {
            type: Number,
            required: true
        },
        totalDetections: {
            type: Number,
            required: true
        },
        validDirections: {
            type: Number,
            required: false
        },
        reason: {
            type: String,
            required: false
        },
        details: [{
            direction: {
                type: String,
                enum: ['center', 'left', 'right', 'up']
            },
            correctDirectionCount: Number,
            totalDetections: Number,
            accuracy: Number,
            anyMovementDetected: Boolean,
            detections: [{
                direction: String,
                timestamp: Number,
                expected: String
            }]
        }]
    },
    storedImageUrl: { 
        type: String,
        required: false 
    },
    capturedImageBase64: { 
        type: String,
        required: true 
    },
    ipAddress: String,
    userAgent: {
        type: String,
        required: true
    },
    errorMessage: String,
    processingTime: Number,
    deviceInfo: {
        platform: String,
        language: String,
        timezone: String
    },
    
    faceDetectionDetails: {
        faceDetected: Boolean,
        faceConfidence: Number,
        landmarksDetected: Boolean
    }
});

schema.index({ matricNumber: 1, timestamp: -1 });
schema.index({ verificationStatus: 1 });
schema.index({ timestamp: -1 });

const VerificationSchema = mongoose.model('Verifications', schema);

export default VerificationSchema;