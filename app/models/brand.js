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
    },

});

var BrandsSchema = new Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: {
        type: String,
        require : true,
        unique: true,
    },
    description: String,
    isVegan:{
        type: Boolean,
        require : true,
    },
    isCrueltyFree:{
        type: Boolean,
        require : true,
    },
    ative:{
        type: Boolean,
        require : true,
    },
    linkPeta: {
        type: String,
    },
    link: {
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
    brandImage: { type: String},
},{
    versionKey:false
});

module.exports = mongoose.model("Brand",BrandsSchema);