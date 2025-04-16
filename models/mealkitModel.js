const mongoose = require("mongoose");

// create a schema
const mealkitSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        auto: true
    },
    name: {
        type: String, 
        require: true,
        unique: true
    },
    includes: {
        type: String, 
        require: true,
    },
    description: {
        type: String, 
        require: true,
    },
    category: {
        type: String, 
        require: true,
    },
    price: {
        type: Number, 
        require: true,
        min: 0.01
    },
    cookingTime: {
        type: Number, 
        require: true,
        min: 1
    },
    servings: {
        type: Number, 
        require: true,
        min: 1
    },
    imageUrl: {
        type: String, 
    },
    featuredMealkit: {
        type: Boolean, 
        require: true,
    },
    altText: {
        type: String, 
    },
});

const mealkitModel = mongoose.model("mealkits", mealkitSchema);

module.exports = mealkitModel;