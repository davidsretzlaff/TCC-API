var mongoose = require('mongoose')
var Schema = mongoose.Schema;

// schema brand
let brand = new Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: {
        type: String,
        require: true,
        unique: false,
    },
});

//schema ingredients
var IngredientsSchema = new Schema({
    _id: mongoose.Schema.Types.ObjectId,
    namePortuguese: {
        type: String,
        require: true,
    },
    nameEnglish: {
        type: String,
    },
});

var ProductsSchema = new Schema({
    _id: mongoose.Schema.Types.ObjectId,
    brand: {
        type: brand,
        require: true,
    },
    ingredients: {
        type: [IngredientsSchema]
    },
    name: {
        type: String,
        require: true,
        unique: true,
    },
    description: String,
    isVegan: {
        type: Boolean,
    },
    isVeganVerify: {
        type: Boolean,
        require: true,
    },
    isCrueltyFreeVerify: {
        type: Boolean,
        require: true,
    },
    isCrueltyFree: {
        type: Boolean,
    },
    barcode: {
        type: String,
    },
    active: {
        type: Boolean,
        require: true,
    },
    productImage: { type: String, required: true },
}, {
        versionKey: false
    });

module.exports = mongoose.model("Product", ProductsSchema);