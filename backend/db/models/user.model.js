mongoose = require('mongoose');
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
dotenv.config();
var Schema = mongoose.Schema
const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        minlength: 1,
        trim: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
    },
    sessions: [{
        token: {
            type: String,
            required: true
        },
        expiresAt: {
            type: Number,
            required: true
        }
    }]
});

userSchema.methods.toJSON = function () {
    const user = this;
    const userObject = user.toObject();
    return _.omit(userObject, ['password', 'sessions']);
};

userSchema.methods.generateAccessAuthToken = function () {
    const user = this;
    return new Promise((resolve, reject) => {
        jwt.sign(
            { _id: user._id.toHexString() },
            process.env.jwtSecret, // Corrected to match typical environment variable naming conventions
            { expiresIn: "15m" },
            (err, token) => {
                if (!err) {
                    resolve(token);
                } else {
                    reject(err);
                }
            }
        );
    });
};

userSchema.methods.generateRefreshToken = function () {
    return new Promise((resolve, reject) => {
        crypto.randomBytes(64, (err, buffer) => {
            if (!err) {
                let token = buffer.toString('hex');
                resolve(token);
            } else {
                reject(err);
            }
        });
    });
};

userSchema.methods.createSession = function () {
    let user = this;
    return user.generateRefreshToken().then((refreshToken) => {
        return saveSessionToDatabase(user, refreshToken);
    }).then((refreshToken) => {
        return refreshToken;
    }).catch((err) => {
        return Promise.reject(err);
    });
};

userSchema.statics.getJWTSecret = () => {
    return process.env.jwtSecret;
}
// Statics
userSchema.statics.findByIdAndToken = function (_id, token) {
    const user = this;
    return user.findOne({
        _id,
        'sessions.token': token // Corrected from 'session.token' to 'sessions.token'
    });
};

userSchema.statics.findByCredentials = function (email, password) {
    let User = this;
    return User.findOne({ email }).then((user) => {
        if (!user) return Promise.reject();
        return new Promise((resolve, reject) => {
            bcrypt.compare(password, user.password, (err, res) => {
                if (res) {
                    resolve(user);
                } else {
                    reject();
                }
            });
        });
    });
};

userSchema.methods.hasRefreshTokenExpired = function (expiresAt) {
    let secondsSinceEpoch = Date.now() / 1000;
    return expiresAt <= secondsSinceEpoch;
};

// Middleware
userSchema.pre('save', function (next) {
    let user = this;
    let costFactor = 10;
    if (user.isModified('password')) {
        bcrypt.genSalt(costFactor, (err, salt) => {
            if (err) return next(err);
            bcrypt.hash(user.password, salt, (err, hash) => {
                if (err) return next(err);
                user.password = hash;
                next();
            });
        });
    } else {
        next();
    }
});

// Helper Functions
let saveSessionToDatabase = (user, refreshToken) => {
    return new Promise((resolve, reject) => {
        let expiresAt = getRefreshTokenExpiration();
        user.sessions.push({ token: refreshToken, expiresAt });
        user.save().then(() => {
            resolve(refreshToken);
        }).catch((e) => {
            reject(e);
        });
    });
};

let getRefreshTokenExpiration = () => {
    let daysUntilExpire = 10;
    let secondsUntilExpire = ((daysUntilExpire * 24) * 60) * 60;
    return Math.floor(Date.now() / 1000) + secondsUntilExpire;
};

// Model
const Users = mongoose.model('Users', userSchema);

module.exports = Users;