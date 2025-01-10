import mongoose from 'mongoose';

const schema = new mongoose.Schema({
    matricnumber: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date, default: null },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
    suspended: { type: Boolean, default: false }
});

const UserSchema = mongoose.model('User', schema);

export default UserSchema;
