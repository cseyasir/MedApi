const http = require('http');
const mysql = require('mysql');
const cors = require('cors');
const port = 5000;

const connection = mysql.createConnection({
  host: 'br2kncimwwsehxyqeqzu-mysql.services.clever-cloud.com',
  user: 'um7fb6dpdltqebgp',
  password: '3vMkAyEUGmwtatRxlVva',
  database: 'br2kncimwwsehxyqeqzu',
});

connection.connect();

const server = http.createServer((req, res) => {
  cors()(req, res, () => {
    if (req.method === 'GET' && req.url === '/medicines') {
      // Fetch all medicines from the database
      connection.query('SELECT * FROM medicine', (error, results) => {
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

      connection.query('SELECT * FROM medicine WHERE medicine_name LIKE ?', [`%${partialName}%`], (error, results) => {
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

      connection.query('SELECT * FROM medicine WHERE medicine_name = ?', [medicineId], (error, results) => {
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
    }
     else if (req.method === 'POST' && req.url === '/medicines') {
      // Add a new medicine
      let newMedicineData = '';
    
      req.on('data', (chunk) => {
        newMedicineData += chunk;
      });
    
      req.on('end', () => {
        try {
          const newMedicine = JSON.parse(newMedicineData);
          
          // Convert price to integer
          newMedicine.price = parseInt(newMedicine.price);
    
          connection.query('INSERT INTO medicine SET ?', newMedicine, (error, result) => {
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
        } catch (error) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'text/plain');
          res.end('Invalid JSON data');
        }
      });
    }
   else if (req.method === 'DELETE' && req.url.startsWith('/medicines/')) {
    // Delete a medicine by ID
    const medicineId = decodeURIComponent(req.url.replace('/medicines/', ''));
  
    connection.query('DELETE FROM medicine WHERE medicine_name = ?', [medicineId], (error, result) => {
      if (error) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Internal Server Error');
      } else {
        if (result.affectedRows > 0) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/plain');
          res.end('Medicine deleted successfully');
        } else {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'text/plain');
          res.end('Medicine not found');
        }
      }
    });
  }else if (req.method === 'PUT' && req.url.startsWith('/medicines/')) {
    // Update all fields of a medicine by name
    const currentMedicineName = decodeURIComponent(req.url.replace('/medicines/', ''));
    let updatedMedicineData = '';
  
    req.on('data', (chunk) => {
      updatedMedicineData += chunk;
    });
  
    req.on('end', () => {
      try {
        const updatedMedicine = JSON.parse(updatedMedicineData);
  
        // Validate and prepare updated fields
        const updatedFields = {};
        if (updatedMedicine.medicine_name !== undefined) {
          updatedFields.medicine_name = updatedMedicine.medicine_name;
        }
        if (updatedMedicine.price !== undefined) {
          updatedFields.price = parseInt(updatedMedicine.price);
        }
        if (updatedMedicine.location !== undefined) {
          updatedFields.location = updatedMedicine.location;
        }
  
        // Check if there are fields to update
        if (Object.keys(updatedFields).length === 0) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'text/plain');
          res.end('No valid fields provided for update');
          return;
        }
  
        connection.query('UPDATE medicine SET ? WHERE medicine_name = ?', [updatedFields, currentMedicineName], (error, result) => {
          if (error) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'text/plain');
            res.end('Internal Server Error');
          } else {
            if (result.affectedRows > 0) {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(updatedFields));
            } else {
              res.statusCode = 404;
              res.setHeader('Content-Type', 'text/plain');
              res.end('Medicine not found');
            }
          }
        });
      } catch (error) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Invalid JSON data');
      }
    });
  }
  
  
  
     else {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain');
      res.end('oops Not Found');
    }
  });
});

server.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}/`);
});