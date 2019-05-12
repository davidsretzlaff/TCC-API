var mongoose = require('mongoose')
var Schema = mongoose.Schema;

var SearchSchema = new Schema({
    name: {
        type: String
    },
    verify: { type: Boolean},
}, {
        versionKey: false
    });

module.exports = mongoose.model("Search", SearchSchema);