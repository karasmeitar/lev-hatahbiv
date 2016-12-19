var express = require('express');
var routes = require('./routes');
var products = require('./models/fireBaseDB');
var http = require('http');
var path = require('path');
var fs = require('fs');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var methodOverride = require('method-override');
var cookieSession = require('cookie-session');
var errorhandler = require('errorhandler');
var router = express.Router();


var app = express();
try {
    var configJSON = fs.readFileSync(__dirname + "/config.json");
    var config = JSON.parse(configJSON.toString());
} catch (e) {
    console.error("File config.json not found or is invalid: " + e.message);
    process.exit(1);
}
routes.init(config);
products.init(config);
app.set('view engine', 'jade');
app.set('port', process.env.PORT || 3000);
app.use(bodyParser.urlencoded({
    extended: true
}));

var allowCrossDomain = function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,contenttype');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
}

app.use(allowCrossDomain);
app.use(bodyParser.json());
app.use(methodOverride('X-HTTP-Method-Override'))
app.use(cookieParser());
app.use(cookieSession({
    name:"lev",
    httpOnly:true,
    maxAge:1000*60*5,
    secure:true,
    keys: ['gilTheKing','gil123'],
    resave: true,
}));

if ('development' == app.get('env')) {
    app.use(errorhandler());
}


app.post('/purchase', routes.purchase);
app.get('/execute', routes.execute);
app.get('/cancel', routes.cancel);

http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});