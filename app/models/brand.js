var mongoose = require('mongoose')
var Schema = mongoose.Schema;

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
},{
    versionKey:false
});

module.exports = mongoose.model("Brand",BrandsSchema);