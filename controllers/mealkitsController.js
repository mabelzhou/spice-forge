const express = require("express");
const router = express.Router();
const path = require("path");
const mealkitModel = require("../models/mealkitModel");
const fs = require("fs");

// group by  meal kits category
function getMealKitsByCategory(mealkits) {
    let result = {};

    // loop through mealkits and group by category
    for (let i = 0; i < mealkits.length; i++) {
        if (result[mealkits[i].category]) {
            result[mealkits[i].category].push(mealkits[i]);
        } else {
            result[mealkits[i].category] = [mealkits[i]];
        }
    }

    // format into array and return
    return Object.keys(result).map(category => ({
        categoryName: category,
        mealKits: result[category]
    }));
}

// on the menu route
router.get("/on-the-menu", async (req, res) => {
    // get all meal kits from collection
    mealkitModel.find()
        .then(data => {
            let allMeals = data.map(value => value.toObject());
            let mealCategories = getMealKitsByCategory(allMeals);
            let featuredMeals = allMeals.filter(meal => meal.featuredMealkit);
            res.render("mealkits/on-the-menu", { 
                title: "On The Menu",
                featuredMeals: featuredMeals,
                mealCategories: mealCategories,
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

// route to list page (GET /mealkits/list)
router.get("/list", (req, res) => {
    // check role
    if (req.session.role !== "clerk") {
        res.status(401);
        return res.render("general/error", { 
            title: "Error",
            message: "You are not authorized to view this page."
         });
    }

    // get all meal kits from collection
    mealkitModel.find()
        .then(data => {
            let meals = data.map(value => value.toObject());
            res.render("mealkits/list", { 
                title: "List",
                meals: meals
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

// route to add page (GET /mealkits/add)
router.get("/add", (req, res) => {
    // check role
    if (req.session.role !== "clerk") {
        res.status(401);
        return res.render("general/error", { 
            title: "Error",
            message: "You are not authorized to view this page."
         });
    }

    res.render("mealkits/add", { title: "Add" });
});

// route to add page (POST /mealkits/add)
router.post("/add", (req, res) => {
    // get form data
    const { name, includes, description, category, price, cookingTime, servings, altText } = req.body;
    const featuredMealkit = !!req.body.featuredMealkit;

    // add meal kit
    const newMealkit = new mealkitModel({name, includes, description, category, price, cookingTime, servings, featuredMealkit, altText});

    // save to database
    newMealkit.save()
        .then(() => {
            console.log(`Added meal kit: ${newMealkit.name}`)

            // get image file
            const imageFile = req.files.foodPic;
            const uniqueName = `pic-${newMealkit._id}${path.parse(imageFile.name).ext}`;

            // check extension
            if (![".jpg", ".jpeg", ".png"].includes(path.parse(imageFile.name).ext)) {
                console.log("Image not saved due to invalid file extension - must be .jpg, .jpeg, .gif, or .png.");
                return res.redirect("/mealkits/list");
            }

            // Copy the image data to a file on the web server.
            imageFile.mv(`assets/images/${uniqueName}`) 
                .then(() => {
                    // saved image file, update document
                    mealkitModel.updateOne({_id: newMealkit._id}, {imageUrl: `/images/${uniqueName}`})
                        .then(() => {
                            console.log("Updated image file.");
                            res.redirect("/mealkits/list");
                        })
                        .catch((err) => {
                            console.log("Error updating document: " + err);
                            res.render("general/error", { 
                                title: "Error",
                                message: "Error updating document."
                             });
                        });
                })
                .catch((err) => {
                    console.log("Error saving image file: " + err);
                    res.render("general/error", { 
                        title: "Error",
                        message: "Error getting meal kit image."
                     });
                });
            })
        .catch((err) => {
            console.log("Error adding meal kit: " + err);
            res.render("general/error", { 
                title: "Error",
                message: "Failed to add meal kit."
             });
        });
});

// route to edit page (GET /mealkits/edit/:id)
router.get("/edit/:id", (req, res) => {
    // check role
    if (req.session.role !== "clerk") {
        res.status(401);
        return res.render("general/error", { 
            title: "Error",
            message: "You are not authorized to view this page."
         });
    }

    // get meal kit by id
    mealkitModel.findById(req.params.id)
        .then(data => {
            let mealkit = data.toObject();
            res.render("mealkits/edit", { 
                title: "Edit",
                mealkit: mealkit
             });
        })
        .catch(err => {
            console.log("Error getting meal kit: " + err);
            res.render("general/error", { 
                title: "Error",
                message: "Error getting meal kit."
             });
        });
});

// route to edit page (POST /mealkits/edit/:id)
router.post("/edit/:id", (req, res) => {
    // get form data
    const { name, includes, description, category, price, cookingTime, servings, altText } = req.body;
    const featuredMealkit = !!req.body.featuredMealkit;

    // update meal kit
    mealkitModel.updateOne({_id: req.params.id}, {name, includes, description, category, price, cookingTime, servings, featuredMealkit, altText})
        .then(() => {
            console.log(`Updated meal kit: ${name}`);

            // if image file is provided
            if (req.files && req.files.foodPic) {
                // get image file
                const imageFile = req.files.foodPic;
                const uniqueName = `pic-${req.params.id}${path.parse(imageFile.name).ext}`;

                // check extension
                if (![".jpg", ".jpeg", ".png"].includes(path.parse(imageFile.name).ext)) {
                    console.log("Image not saved due to invalid file extension - must be .jpg, .jpeg, .gif, or .png.");
                    return res.redirect("/mealkits/list");
                }

                // Copy the image data to a file on the web server.
                imageFile.mv(`assets/images/${uniqueName}`) 
                    .then(() => {
                        // saved image file, update document
                        mealkitModel.updateOne({_id: req.params.id}, {imageUrl: `/images/${uniqueName}`})
                            .then(() => {
                                console.log("Updated image file.");
                                res.redirect("/mealkits/list");
                            })
                            .catch((err) => {
                                console.log("Error updating document: " + err);
                                res.render("general/error", { 
                                    title: "Error",
                                    message: "Error updating document."
                                 });
                            });
                    })
                    .catch((err) => {
                        console.log("Error saving image file: " + err);
                        res.render("general/error", { 
                            title: "Error",
                            message: "Error getting meal kit image."
                         });
                    });
            } else {
                res.redirect("/mealkits/list");
            }
        })
        .catch(err => {
            console.log("Error updating meal kit: " + err);
            res.render("general/error", { 
                title: "Error",
                message: "Error updating meal kit."
             });
        });
});

// route to confirm remove meal kit page (GET /mealkits/remove/:id)
router.get("/remove/:id", (req, res) => {
    // check role
    if (req.session.role !== "clerk") {
        res.status(401);
        return res.render("general/error", { 
            title: "Error",
            message: "You are not authorized to view this page."
         });
    }

    // get meal kit by id
    mealkitModel.findById(req.params.id)
        .then(data => {
            let mealkit = data.toObject();
            res.render("mealkits/remove", { 
                title: "Remove",
                mealkit: mealkit
             });
        })
        .catch(err => {
            console.log("Error getting meal kit: " + err);
            res.render("general/error", { 
                title: "Error",
                message: "Error getting meal kit."
             });
        });
});

// route to remove meal kit (POST /mealkits/remove/:id)
router.post("/remove/:id", (req, res) => {
    // get meal kit by id
    mealkitModel.findById(req.params.id)
        .then(data => {
            let mealkit = data.toObject();

            // remove meal kit
            mealkitModel.deleteOne({_id: req.params.id})
                .then(() => {
                    console.log(`Removed meal kit: ${mealkit.name}`);

                    // remove image file from server
                    const imagePath = path.join(__dirname, '../assets/', mealkit.imageUrl);
                    fs.unlink(imagePath, (err) => {
                        if (err) {
                            console.error("Error deleting image file:", err);
                        } else {
                            console.log("Image file deleted successfully.");
                        }
                    });

                    // redirect to list page
                    res.redirect("/mealkits/list");
                })
                .catch(err => {
                    console.log("Error removing meal kit: " + err);
                    res.render("general/error", { 
                        title: "Error",
                        message: "Error removing meal kit."
                    });
                });
        })
        .catch(err => {
            console.log("Error getting meal kit: " + err);
            res.render("general/error", { 
                title: "Error",
                message: "Error getting meal kit."
            });
        });
});


module.exports = router;