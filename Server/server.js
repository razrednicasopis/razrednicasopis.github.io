const express = require('express');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const dnsRoutes = require('../routes/dnsRoutes');
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  blink: "\x1b[5m",
  reverse: "\x1b[7m",
  hidden: "\x1b[8m",
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  bgBlack: "\x1b[40m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
  bgWhite: "\x1b[47m"
};

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// MongoDB Database Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/node_mongoose_freedns')
  .then(() => console.log(colors.green + 'Successfully connected to the database.' + colors.reset))
  .catch(err => console.error(colors.red + 'Failed to connect to the database', err + colors.reset));

// Serve static files from the "Resources" directory
app.use(express.static(path.join(__dirname, '../Resources')));

// Routes
app.use('/', dnsRoutes);

// Serve the index.html file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../Resources', 'index.html'));
});

// Serve the maintenance page (popravila.html) when the server is offline
const maintenancePagePath = path.join(__dirname, '../Resources', 'popravila.html');

app.use((req, res, next) => {
  fs.access(maintenancePagePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error('Maintenance page not found:', err);
      res.status(404).send('Maintenance page not found');
    } else {
      res.status(503).sendFile(maintenancePagePath);
    }
  });
});

// Start the server
const server = app.listen(PORT, () => {
  console.log(colors.green + `The server is now online. Local port: http://localhost:${PORT}` + colors.reset);
});

// Handle SIGINT signal (Ctrl+C)
process.on('SIGINT', () => {
  console.log(colors.red + 'Received SIGINT signal. Closing server...' + colors.reset);
  server.close(() => {
    console.log(colors.red + 'The server is now offline.' + colors.reset);
    process.exit(0);
  });
});
