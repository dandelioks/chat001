var mongoose = require('mongoose');
var config = require('../config/index');

mongoose.connect(config.get('mongoose:uri'), { useNewUrlParser: true });

module.exports = mongoose;
