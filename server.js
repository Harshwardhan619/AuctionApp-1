//initializing and loading things
var express  = require('express');
var app = express();
var port = process.env.PORT || 8080;
var serv = require('http').Server(app);
var io = require('socket.io').listen(serv);
var passport = require('passport');
var flash    = require('connect-flash');

var session  = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var morgan = require('morgan');

var configDB = require('./config/database.js');

//==============================================================


require('./config/passport')(passport); // passport for configuration

// set up of express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(bodyParser.json());

app.set('view engine', 'ejs'); // set up ejs for templating

// required for passport
app.use(session({ secret: "winteriscoming",
						cookie: {
							httpOnly: true,
							secure: false
						} })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session


// routes ======================================================================
require('./app/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport
// require('./app/functions.js')(app);

// launch ======================================================================
serv.listen('8080', function () {
	console.log('server initiated');
})
console.log('The magic happens on port ' + port);

//=============== CHAT CODE ======================

 var clients =[];

    io.sockets.on('connection', function (socket) {

        socket.on('storeClientInfo', function (data) {

            var clientInfo = new Object();
            clientInfo.customId = data.id;
            clientInfo.clientId = socket.id;
            clients.push(clientInfo);
            console.log("Added new client " + JSON.stringify(clients));
        });


        socket.on('chat_message', function(data){
        	console.log(data);
        	console.log("New msg recieved " + JSON.stringify(clients) + JSON.stringify(data));

        	var toWhom;

        	for(var i = 0; i < clients.length; i++)
			{
			  if(clients[i].customId == data.ToWhomId)
			  {
			    toWhom = clients[i].clientId;
			    break;
			  }
			}
			console.log(toWhom);

			if(toWhom){
				senddata = {
					msg : data.msg,
					to : toWhom,
					from : socket.id
				}
				io.to(toWhom).emit('newChatMsg', senddata);
			}



			// 

        });

        socket.on('disconnect', function (data) {

            for( var i=0, len=clients.length; i<len; ++i ){
                var c = clients[i];

                if(c.clientId == socket.id){
                    clients.splice(i,1);
                    console.log("client removed " + JSON.stringify(clients));
                    break;
                }
            }

        });
    });
//https://scotch.io/tutorials/easy-node-authentication-setup-and-local
