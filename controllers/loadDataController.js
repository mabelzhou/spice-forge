const express = require("express");
const router = express.Router();
const mealkitUtils = require("../modules/mealkit-utils");
const mealkitModel = require("../models/mealkitModel");

// set up routes
router.get("/mealkits", (req, res) => {
    // check role
    if (req.session.role !== "clerk") {
        res.status(403);
        return res.render("general/error", { 
            title: "Error",
            message: "You are not authorized to view this page."
         });
    }

    // get all meal kits from module
    const defaultMealkits =  mealkitUtils.getAllMealkits();

    // count number of documents
    mealkitModel.countDocuments()
        .then(count => {
            // check if data is loaded already
            if (count === 0) {
                // insert default meal kits
                mealkitModel.insertMany(defaultMealkits)
                    .then(() => {
                        console.log("Added meal kits to the database.");
                        res.render("load-data/loadData", { 
                            title: "Meal Kits",
                            message: "Added meal kits to the database"
                        });
                    })
                    .catch(err => {
                        console.log("Error adding meal kits to database.");
                        res.render("load-data/loadData", { 
                            title: "Error",
                            message: "Error adding meal kits to database."
                        });
                    });
            } else {
                // data already loaded
                console.log("Meal kits already in the database.");
                res.render("load-data/loadData", { 
                    title: "Meal Kits",
                    message: "Meal kits have already been added to the database."
                });
            }
        })
        .catch(err => {
            console.log("Error getting number of documents.");
            res.render("load-data/loadData", { 
                title: "Error",
                message: "Couldn't get number of documents."
            });
        });
});

module.exports = router;