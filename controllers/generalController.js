const express = require("express");
const router = express.Router();
const mealkitModel = require("../models/mealkitModel");
const userModel = require("../models/userModel");
const bcryptjs = require("bcryptjs");
const path = require("path");

// set up mailgun
const formData = require('form-data');
const Mailgun = require('mailgun.js');
const mailgun = new Mailgun(formData);
const mg = mailgun.client({username: 'api', key: process.env.MAILGUN_API_KEY});

// home route
router.get("/", async (req, res) => {
    // get all featured meal kits from collection
    mealkitModel.find({ featuredMealkit: true })
        .then(data => {
            let featuredMeals = data.map(value => value.toObject());
            res.render("general/home", { 
                title: "Home",
                featuredMeals: featuredMeals,
                role: req.session.role
             });
        })
        .catch(err => {
            console.log("Error getting meal kits: " + err);
            res.render("general/error", { 
                title: "Error",
                message: "Error getting meal kits."
             });
        });
});

// route to registration page (GET /general/sign-up)
router.get("/sign-up", (req, res) => {
    res.render("general/sign-up", { 
        title: "Sign Up",
        validationMessages:{},
        values: {
            inputFirstName: "",
            inputLastName: "",
            inputEmail: "",
            inputPassword: ""
        } 
    });
});

// validate registration form data
async function validateRegistration(inputFirstName, inputLastName, inputEmail, inputPassword) {
    let passedValidation = true;
    let validationMessages = {};

    // first name
    if (typeof inputFirstName !== "string") {
        passedValidation = false;
        validationMessages.inputFirstName = "First name is required";
    } else if (inputFirstName.trim().length === 0) {
        passedValidation = false;
        validationMessages.inputFirstName = "First name is required";
    } else if (inputFirstName.trim().length < 2) {
        passedValidation = false;
        validationMessages.inputFirstName = "First name must be at least 2 characters";
    }

    // last name
    if (typeof inputLastName !== "string") {
        passedValidation = false;
        validationMessages.inputLastName = "Last name is required";
    } else if (inputLastName.trim().length === 0) {
        passedValidation = false;
        validationMessages.inputLastName = "Last name is required";
    } else if (inputLastName.trim().length < 2) {
        passedValidation = false;
        validationMessages.inputLastName = "Last name must be at least 2 characters";
    }

    // email
    const emailRegex = /\S+@\S+\.\S+/;
    if (typeof inputEmail !== "string") {
        passedValidation = false;
        validationMessages.inputEmail = "Email is required";
    } else if (inputEmail.trim().length === 0) {
        passedValidation = false;
        validationMessages.inputEmail = "Email is required";
    } else if (!emailRegex.test(inputEmail)) {
        passedValidation = false;
        validationMessages.inputEmail = "Email is not valid";
    } else if (await checkEmailExists(inputEmail)) {
        passedValidation = false;
        validationMessages.inputEmail = "Email already exists";
    }

    // password
    validationMessages.inputPassword = []; // initialize empty array of messages

    // check null or empty
    if (typeof inputPassword !== "string") {
        passedValidation = false;
        validationMessages.inputPassword.push("Password is required");
    } else if (inputPassword.trim().length === 0) {
        passedValidation = false;
        validationMessages.inputPassword.push("Password is required");
    } else { // check email requirements
        if (inputPassword.trim().length < 8 || inputPassword.trim().length > 12) {
            passedValidation = false;
            validationMessages.inputPassword.push("Password must be between 8-12 characters");
        }
        if (!inputPassword.match(/[a-z]/)) {
            passedValidation = false;
            validationMessages.inputPassword.push("Password must contain at least one lowercase letter");
        } 
        if (!inputPassword.match(/[A-Z]/)) {
            passedValidation = false;
            validationMessages.inputPassword.push("Password must contain at least one uppercase letter");
        }
        if (!inputPassword.match(/\d/)) {
            passedValidation = false;
            validationMessages.inputPassword.push("Password must contain at least one number");
        } 
        if (!inputPassword.match(/[!@#$%^&*./,';\]\[=\)\(\+\?_:\{\}\|~<>"]/)) {
            passedValidation = false;
            validationMessages.inputPassword.push("Password must contain at least one special character");
        }
    } 

    return {
        passedValidation: passedValidation,
        validationMessages: validationMessages
    };
}

// check if email exists
async function checkEmailExists(email) {
    const user = await userModel.findOne({email});
    return !!user;
}

// route to registration page (POST /general/sign-up)
router.post("/sign-up", async (req, res) => {
    // get form data
    const { inputFirstName, inputLastName, inputEmail, inputPassword } = req.body;

    // validate form data
    let { passedValidation, validationMessages } = await validateRegistration(inputFirstName, inputLastName, inputEmail, inputPassword);

    // create new user
    if (passedValidation) {
        const newUser = new userModel({
            fName: inputFirstName,
            lName: inputLastName,
            email: inputEmail,
            password: inputPassword
        });
        newUser.save()
        .then(userSaved => {
            console.log(`User ${userSaved} added to the database`);
        })
        .catch(err => {
            console.log(`Error adding user to the database: ${err}`);
        });
    }
    
    // redirect user
    if (passedValidation) {
        mg.messages.create(process.env.MAILGUN_DOMAIN, {
         from: `Spice Forge Team <mailgun@${process.env.MAILGUN_DOMAIN}>`,
         to: [`${inputEmail}`],
         subject: "Spice Forge Registration Success!",
         text: "Testing some Mailgun awesomness!",
         html: `<h1>Welcome to Spice Forge, ${inputFirstName}!</h1>
         Your account has been successfully registered under: ${inputEmail} <br> <br>
         Thank you for signing up with Spice Forge. We are excited to have you join us! <br> <br>
         -Mabel Zhou, Spice Forge Representative <br>
         `
        })
        .then(msg => {
         console.log(msg); 
         res.redirect("/general/welcome");
        })
        .catch(err => {
         console.log(err); 
         res.status(500).send('An error occurred while sending the email.'); 
        });
     } else {
        console.log(validationMessages);
        console.log("Sign up failed validation")
         res.render("general/sign-up", { 
             title: "Sign Up",
             validationMessages: validationMessages,
             values: req.body
         });
     } 
});

// route to log in page (GET /general/log-in)
router.get("/log-in", (req, res) => {
    res.render("general/log-in", { 
        title: "Log In",
        errors: [],
        values: {
            inputEmail: "",
            inputPassword: ""
        }
     });
});

// route to log in page (POST /general/log-in)
router.post("/log-in", (req, res) => {
    const { role, inputEmail, inputPassword } = req.body;

    let errors = [];

    userModel.findOne({
        email: inputEmail
    })
        .then(user => {
            if (user) {
                // compare password
                bcryptjs.compare(inputPassword, user.password)
                    .then(matched => {
                        // passwords match
                        if (matched) {
                            // set session
                            req.session.user = user;
                            req.session.role = role;
                            console.log(`User logged in`);
                            console.log(`Role: ${role}` );

                            // redirect user
                            if (role === "clerk") {
                                res.redirect("/mealkits/list");
                            } else {
                                res.redirect("/cart");
                            }
                        } else {
                            // passwords don't match
                            errors.push("Email and/or password is invalid");
                            console.log("Password doesn't match");
                            res.render("general/log-in", { 
                                title: "Log In",
                                values: req.body,
                                errors: errors,
                            });
                        }
                    })
                    .catch(err => {
                        errors.push("Couldn't compare password");
                        console.log(`Error comparing password: ${err}`);
                        res.render("general/log-in", { 
                            title: "Log In",
                            values: req.body,
                            errors: errors,
                        });
                    });
            } else {
                errors.push("Couldn't find user with this email");
                console.log(`Couldn't find user ${inputEmail}`);
                res.render("general/log-in", { 
                    title: "Log In",
                    values: req.body,
                    errors: errors,
                });
            }
        })
        .catch(err => {
            errors.push("Couldn't get user");
            console.log(`Cound't get user ${inputEmail}: ${err}`);
            res.render("general/log-in", { 
                title: "Log In",
                values: req.body,
                errors: errors,
            });
        });
})

// welcome page after registration
router.get("/welcome", (req, res) => {
    res.render("general/welcome", { title: "Welcome" });
});

// route to log out (GET /general/log-out)
router.get("/log-out", (req, res) => {
    // clear session from memory
    req.session.destroy();

    res.redirect("/");
});

router.get("/about-us", (req, res) => {
    res.render("general/about-us", { title: "About Us" });
});

router.get("/pricing", (req, res) => {
    res.render("general/pricing", { title: "Pricing" });
});

router.get("/contact", (req, res) => {
    res.render("general/contact", { title: "Contact" });
});

router.get("/other", (req, res) => {
    res.send("Other");
});

module.exports = router;