var fs = require('fs');
var LOCAL_SETTINGS_PATH = './local_settings.js';

var _ = require('underscore')._;
var local_settings = fs.existsSync(LOCAL_SETTINGS_PATH) ? require(LOCAL_SETTINGS_PATH).settings : {};

exports.settings = _.extend(process.env, local_settings);
