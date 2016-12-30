var express = require('express');
var routes = require('./routes');
var products = require('./models/fireBaseDB');
var http = require('http');
var path = require('path');
var fs = require('fs');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var methodOverride = require('method-override');
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

app.use(bodyParser.json());

var allowCrossDomain = function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
    res.setHeader('Access-Control-Allow-Credentials', true);

    if(req.method==='OPTIONS'){
        res.status(200);
        res.end()
    }
    else {
        next();
    }
}

app.use(allowCrossDomain);
app.use(methodOverride('X-HTTP-Method-Override'))
app.use(cookieParser());
if ('development' == app.get('env')) {
    app.use(errorhandler());
}

app.use(function (req, res, next) {
    // check if client sent cookie
    var cookie = req.cookies.lev;
    console.log(JSON.stringify(req.cookies));

    if (cookie === undefined)
    {
        // no: set a new cookie

        res.cookie('lev',{}, { maxAge: 900000});
        console.log('cookie created successfully');
    }
    else
    {
        console.log('cookie exists', cookie);
    }
    next();
});


app.post('/purchase', routes.purchase);
app.get('/execute', routes.execute);
app.get('/cancel', routes.cancel);

http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});