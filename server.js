const http = require('http');
const mysql = require('mysql');
const cors = require('cors');
const port = 5000;

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Cseeng123#',
  database: 'medical'
});

connection.connect();

const server = http.createServer((req, res) => {
  cors()(req, res, () => {
    if (req.method === 'GET' && req.url === '/medicines') {
      // Fetch all medicines from the database
      connection.query('SELECT * FROM Medicine', (error, results) => {
        if (error) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'text/plain');
          res.end('Internal Server Error');
        } else {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(results));
        }
      });
    } else if (req.method === 'GET' && req.url.startsWith('/medicines/search?')) {
      // Search for medicines by name
      const query = req.url.split('?')[1]; // Extract query parameter
      const partialName = decodeURIComponent(query.split('=')[1]).toLowerCase();

      connection.query('SELECT * FROM Medicine WHERE medicine_name LIKE ?', [`%${partialName}%`], (error, results) => {
        if (error) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'text/plain');
          res.end('Internal Server Error');
        } else {
          if (results.length > 0) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(results));
          } else {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'text/plain');
            res.end('No matching medicines found');
          }
        }
      });
    } else if (req.method === 'GET' && req.url.startsWith('/medicines/')) {
      // Fetch a specific medicine by ID
      const medicineId = decodeURIComponent(req.url.replace('/medicines/', ''));

      connection.query('SELECT * FROM Medicine WHERE medicine_name = ?', [medicineId], (error, results) => {
        if (error) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'text/plain');
          res.end('Internal Server Error');
        } else {
          if (results.length > 0) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(results[0]));
          } else {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'text/plain');
            res.end('Medicine not found');
          }
        }
      });
    } else if (req.method === 'POST' && req.url === '/medicines') {
      // Add a new medicine
      let newMedicineData = '';

      req.on('data', (chunk) => {
        newMedicineData += chunk;
      });

      req.on('end', () => {
        const newMedicine = JSON.parse(newMedicineData);

        connection.query('INSERT INTO Medicine SET ?', newMedicine, (error, result) => {
          if (error) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'text/plain');
            res.end('Internal Server Error');
          } else {
            newMedicine.id = result.insertId;
            res.statusCode = 201;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(newMedicine));
          }
        });
      });
    } else {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain');
      res.end('oops Not Found');
    }
  });
});

server.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}/`);
});
