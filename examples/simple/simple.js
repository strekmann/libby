var express = require('express'),
    app = require('../../index')(express);

app.get('/', function(req, res){
  res.render('index', { users: users });
});

app.use(express.static(__dirname + '/public'));

app.set('views', __dirname + '/views');

// Set our default template engine to "jade"
// which prevents the need for extensions
// (although you can still mix and match)
app.set('view engine', 'jade');

function User(name, email) {
  this.name = name;
  this.email = email;
}

// Dummy users
var users = [
    new User('Arnt', 'a@example.com'),
    new User('Ove', 'o@example.com')
];

app.listen(3000);
console.log('Express app started on port 3000');
