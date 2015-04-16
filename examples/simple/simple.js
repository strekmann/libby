var express = require('express'),
    libby = require('../../index'),
    app = libby(express);

// Set up example data
function User(name, email) {
  this.name = name;
  this.email = email;
}

var users = [
    new User('Arnt', 'a@example.com'),
    new User('Ove', 'o@example.com')
];

// Express configuration
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

// Define route.
app.get('/', function(req, res){
  res.render('index', { users: users });
});

// Static route at end.
app.use(express.static(__dirname + '/public'));


app.listen(3000);
console.log('Express app started on port 3000');
