import mongoose from 'mongoose';

const schema = new mongoose.Schema({
    timestamp: { type: Date, required: true },
    status: { type: String, required: true },
});

const UptimeSchema = mongoose.model('Uptime', schema);

export default UptimeSchema;
