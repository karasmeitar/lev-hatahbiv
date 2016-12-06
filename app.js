var express = require('express');
var routes = require('./routes');
var products = require('./models/productsDb');
var http = require('http');
var path = require('path');
var fs = require('fs');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var methodOverride = require('method-override');
var session = require('express-session');
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

app.set('port', process.env.PORT || 3000);
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(methodOverride('X-HTTP-Method-Override'))
app.use(cookieParser());
app.use(session({
    secret: 'gilTheKing',
    resave: false,
    saveUninitialized: true
}));

if ('development' == app.get('env')) {
    app.use(errorhandler());
}

app.get('/', routes.index);
app.post('/purchase', routes.purchase);
app.get('/execute', routes.execute);
app.get('/cancel', routes.cancel);

http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});