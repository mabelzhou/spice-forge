const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// create a schema
const userSchema = new mongoose.Schema({
    fName: {
        type: String, 
        require: true
    },
    lName: {
        type: String, 
        require: true
    },
    email: {
        type: String, 
        require: true,
        unique: true,
    },
    password: {
        type: String, 
        require: true
    },
    profilePic: String,
    dateCreated: {
        type: Date,
        default: Date.now
    }
});

userSchema.pre("save", function (next) {
    let user = this;

    // generate unique salt
    bcrypt.genSalt()
        .then(salt => {
            // hash the password
            bcrypt.hash(user.password, salt)
                .then(hashedPwd => {
                    user.password = hashedPwd;
                    next();
                })
                .catch(err => {
                    console.log(`Error in hashing password: ${err}`);
                });
        })
        .catch(err => {
            console.log(`Error in salt generation: ${err}`);
        })
});

const userModel = mongoose.model("users", userSchema);

module.exports = userModel;