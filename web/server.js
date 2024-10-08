const express = require('express');
const morgan = require('morgan');
const path = require('path');

const DEFAULT_PORT = process.env.PORT || 6420;

// initialize express.
const app = express();

// Configure morgan module to log all requests.
app.use(morgan('dev'));

// Setup app folders.
app.use(express.static('static'));

// Set up a route for signout.html
app.get('/signout', (req, res) => {
    res.sendFile(path.join(__dirname + '/static/signout.html'));
});

app.get('/redirect', (req, res) => {
    res.sendFile(path.join(__dirname + '/static/redirect.html'));
});

// chat 
app.get('/chat', (req, res) => {
	res.sendFile(path.join(__dirname, '/static/chat.html'));
});

// Set up a route for index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/static/index.html'));
});

app.listen(DEFAULT_PORT, () => {
    console.log(`Sample app listening on port ${DEFAULT_PORT}!`)
});

module.exports = app;