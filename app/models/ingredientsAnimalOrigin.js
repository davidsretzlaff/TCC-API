var mongoose = require('mongoose')
var Schema = mongoose.Schema;

var IngredientsAnimalOriginSchema = new Schema({
    _id: mongoose.Schema.Types.ObjectId,
    namePortuguese: {
        type: String,
        require : true,
        unique: true,
    },
    nameEnglish: {
        type: String,
        unique: true,
    },
},{
    versionKey:false
});

module.exports = mongoose.model("IngredientsAnimalOrigin",IngredientsAnimalOriginSchema);