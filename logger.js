var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var winston = require('winston');
var env       = process.env.NODE_ENV || "development";
var config    = require(path.join(__dirname,'config.json'));

var dir = config.log_path;
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
}

function getDateData() {
    var d = new Date();
    var currDate = addLeadingZero(d.getDate());
    var currMonth = addLeadingZero(d.getMonth() + 1);
    var currYear = d.getFullYear();
    var currMin = addLeadingZero(d.getMinutes());
    var currHr = addLeadingZero(d.getHours());
    var currSc = addLeadingZero(d.getSeconds());
    return currYear + '-' + currMonth + '-' + currDate + ' ' + currHr + ':' + currMin + ':' + currSc;
}
function addLeadingZero(str, forMs) {
    if (forMs) {
        return String('00' + str).slice(-3);
    }

    return String('0' + str).slice(-2);
}

function generateStack() {
    var i, length, splitStack;
    var stackTrace = new Error().stack;

    var result = [];
    splitStack = stackTrace.split('\n');
    for (i = 0, length = splitStack.length; i < length; i++) {
        if (splitStack[i] === 'Error') {
            continue;
        }
        if (splitStack[i].indexOf(__filename) === -1) {
            result.push(_.trim(splitStack[i]));
        }
    }
    return result.join('->');
}

module.exports.LogLevel = {
    DEBUG: 'debug',
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error'
};

winston.emitErrs = false;
exports.logger = new winston.Logger({
    level: config.log_level,
    transports: [
        new winston.transports.Console({
            handleExceptions: true,
            json: false,
            colorize: true
        }),
        new winston.transports.File({
            filename: path.join(dir, 'Lev.log'),
            //handleExceptions: true,
            json: false,
            maxFiles: 10,
            maxsize: 100 * 1024 * 1024, //100MB ,This param is in byte
            colorize: false,
            timestamp: function () {
                return getDateData();
            }
        })
    ],
    exitOnError: false
});

module.exports = {
    ENV: process.env['NODE_ENV'],
    debug: function (msg, obj) {
        this.writeLog(exports.LogLevel.DEBUG, msg, obj);
    },
    info: function (msg, obj) {
        this.writeLog(exports.LogLevel.INFO, msg, obj);
    },
    warning: function (msg, obj) {
        this.writeLog(exports.LogLevel.WARN, msg, obj);
    },
    error: function (msg, obj) {
        this.writeLog(exports.LogLevel.ERROR, msg, obj);
    },
    writeLog: function (logLevel, msg, obj) {

        if (_.isObject(msg)) {
            obj = msg;
            msg = '';
        }

        var metadata = {};
        if (obj instanceof Error) {
            metadata.stack = obj.stack;
            metadata.localStack = generateStack();
            if (!msg) {
                msg = obj.message || 'No message was given';
            } else {
                metadata.data = obj.message;
            }
        } else {
            //metadata.stack = generateStack();
            if (_.isObject(obj)) {
                if (obj.toString === Object.prototype.toString) {
                    metadata.data = JSON.stringify(obj);
                } else {
                    metadata.data = obj.toString();
                }
            }
            if (_.isString(obj) || _.isNumber(obj) || _.isBoolean(obj)) {
                metadata.data = obj;
            }
        }

        exports.logger.log(logLevel, msg, metadata);
    },
    exitAfterFlush: function (code) {
        exports.logger.transports.file.on('flush', function () {
            process.exit(code);
        });
    }
};