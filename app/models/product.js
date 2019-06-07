var mongoose = require('mongoose')
var Schema = mongoose.Schema;

// user to like/dislike/comments
const UserSchema = new mongoose.Schema({
    id_:mongoose.Schema.Types.ObjectId,
    name: {
        type: String,
        require: true,
    }, 
    email: {
        type: String,
        required: true,
        lowercase: true,
    },
});

const LikeSchema = new mongoose.Schema({
    user: {
        type: UserSchema,
        required: true,
    },
});

const Dislikechema = new mongoose.Schema({
    user: {
        type: UserSchema,
        required: true,
    },
});

//schema ingredients
var IngredientsSchema = new Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: {
        type: String,
        require: true,
    }
});

// schema comments
const CommentsSchema = new mongoose.Schema({
    user: {
        type: UserSchema,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    description:{
        type: String, 
        required : true
    }
});

var ProductsSchema = new Schema({
    _id: mongoose.Schema.Types.ObjectId,
    brand: {
        type: String,
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
    link: {
        type: String,
    },
    linkPeta: {
        type: String,
    },
    like: {
        type: [LikeSchema],
    },
    dislike: {
        type: [Dislikechema],
    },
    comments:{
        type: [CommentsSchema]
    },
    productImage: { type: String, required: false },
}, {
        versionKey: false
    });

module.exports = mongoose.model("Product", ProductsSchema);