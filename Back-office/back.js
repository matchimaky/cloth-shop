const bodyParser = require('body-parser');
const path = require('path');
const mysql = require('mysql2');
const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set("view engine", "ejs");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/login_page.html'));
});

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Mtck1234*',
    database: 'clothshop'
  });

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
    return;
  }
  console.log('Connected to database');
});

app.post('/register', (req, res) => {
    const { email, firstname, lastname, password, confirmpassword } = req.body;
  
    if (password !== confirmpassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }
    
    const sql = 'INSERT INTO registmyshop (email, firstname, lastname, password) VALUES (?, ?, ?, ?)';
    connection.query(sql, [email, firstname, lastname, password], (err, result) => {
      if (err) {
        console.error('Error registering user:', err);
        return res.status(500).json({ error: 'Something went wrong' });
      }
      console.log('User registered successfully');
     
      res.redirect('/login_page.html');
    });
  });

  app.post('/login', (req, res) => {
    const { email, password } = req.body;
  
    const sql = 'SELECT * FROM registmyshop WHERE email = ? AND password = ?';
    connection.query(sql, [email, password], (err, results) => {
      if (err) {
        console.error('Error during login:', err);
        return res.status(500).json({ error: 'Something went wrong' });
      }
  
      if (results.length === 1) {
       
         res.redirect('/back_office.html');
        
         const user = results[0];
        const insertSql = 'INSERT INTO loginmyshop (email, password) VALUES (?, ?)';
        connection.query(insertSql, [user.email, user.password], (insertErr, insertResult) => {
          if (insertErr) {
            console.error('Error storing login data:', insertErr);
          } else {
            console.log('Login data stored successfully');
          }
        });
      } else {
        res.redirect('/?error=1');
        console.log('wrong email or password');
      }
    });
  });
  
app.get('/sales_history', (req, res) => {
    const sql = `
    SELECT b.bill_id, b.bill_date, b.product_id, b.number_of_items, b.bill_price
    FROM (
        SELECT bill_id, bill_date, SUM(number_of_items) AS total_items, SUM(bill_price) AS total_price
        FROM bill
        GROUP BY bill_id, bill_date
    ) AS grouped
    INNER JOIN bill AS b ON grouped.bill_id = b.bill_id AND grouped.bill_date = b.bill_date`;

  
    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching sales history:', err);
            return res.status(500).json({ error: 'Something went wrong' });
        }
        res.render('sales_history', { sales: results });
    });
});

app.get('/bill_summary', (req, res) => {

    const sql = `
    SELECT bill_id, bill_date, SUM(bill_price) AS total_price
    FROM bill
    GROUP BY bill_id, bill_date`;

    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching sales history:', err);
            return res.status(500).json({ error: 'Something went wrong' });
        }
       
        res.render('bill_summary', { sales: results });
    });
});

app.get('/best_seller', (req, res) => {
    
    const sql = `
    SELECT product_id, product_name, product_images1, product_sales_count AS sales_count, 
       SUM(product_sales_count * product_price) AS total_sales
        FROM product
        GROUP BY product_id
        ORDER BY product_sales_count DESC
        LIMIT 10;
        `
    ;
  
    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching best seller data:', err);
            return res.status(500).json({ error: 'Something went wrong' });
        }

         res.render('best_seller', { products: results });
    });
});

app.get('/user_profile', (req, res) => {
  const sql = `
     SELECT r.firstname, l.email, l.password
     FROM registmyshop AS r
     INNER JOIN loginmyshop AS l ON r.email = l.email
     ORDER BY l.created_at DESC
     LIMIT 1
 `;
 connection.query(sql, (err, results) => {
     if (err) {
         console.error('Error fetching user profile data:', err);
         return res.status(500).json({ error: 'Something went wrong' });
     }

     if (results.length === 1) {
         const user = results[0];
         res.render('user_profile', { user });
     } else {
         res.status(404).send('User not found');
     }
 });
});

app.get('/category', (req, res) => {
    const sql = 'SELECT * FROM category';
    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching category data:', err);
            return res.status(500).json({ error: 'Something went wrong' });
        }
         res.render('category', { categories: results });
    });
});

app.post('/delete_category', (req, res) => {
  const categoryId = req.body.category_id; 
  const sql = 'DELETE FROM clothshop.category WHERE category_id = ?'; 
  connection.query(sql, [categoryId], (err, result) => {
      if (err) {
          console.error('Error deleting category:', err);
          return res.status(500).json({ error: 'Something went wrong' });
      }
      console.log('Category deleted successfully');
      res.redirect('/category');
  });
});


  app.post('/create_category', (req, res) => {
    console.log('Received request to create category:', req.body);

    const { category_name, category_id } = req.body;

    console.log('Category Name:', category_name);
    console.log('Category ID:', category_id);
    

    const sql = 'INSERT INTO clothshop.category (category_id, category_name ) VALUES (?, ?)';
    connection.query(sql, [category_id , category_name], (err, result) => {
        if (err) {
            console.error('Error creating category:', err);
            return res.status(500).json({ error: 'Something went wrong' });
        }
        console.log('Category created successfully');
        res.redirect('/category');
    });
});

app.get('/product', (req, res) => {
  const sql = 'SELECT p.*, c.category_name FROM product p JOIN category c ON p.category_id = c.category_id'; 
  connection.query(sql, (err, results) => {
      if (err) {
          console.error('Error fetching product data:', err);
          return res.status(500).json({ error: 'Something went wrong' });
      }
      results.forEach(product => {
          product.product_price = parseFloat(product.product_price); 
      });

      // Fetch categories separately
      const sqlCategories = 'SELECT category_name FROM category';
      connection.query(sqlCategories, (err, categories) => {
          if (err) {
              console.error('Error fetching category data:', err);
              return res.status(500).json({ error: 'Something went wrong' });
          }
          // Render the product template with both products and categories
          res.render('product', { product: results, categories: categories.map(category => category.category_name) }); 
      });
  });
});

app.get('/cate_item/:categoryId', (req, res) => {
  const categoryId = req.params.categoryId;
  const sql = 'SELECT * FROM category WHERE category_id = ?';
  connection.query(sql, [categoryId], (err, results) => {
      if (err) {
          console.error('Error fetching category data:', err);
          return res.status(500).json({ error: 'Something went wrong' });
      }
      if (results.length === 0) {
         
          return res.status(404).json({ error: 'Category not found' });
      }
      
      res.render('cate_item', { category: results[0] });
  });
});

app.post('/update_category/:categoryId', (req, res) => {
  const { categoryName } = req.body;
  const categoryId = req.params.categoryId;

  const sql = 'UPDATE clothshop.category SET category_name = ? WHERE category_id = ?';
  connection.query(sql, [categoryName, categoryId], (err, result) => {
      if (err) {
          console.error('Error updating category:', err);
          return res.status(500).json({ error: 'Something went wrong' });
      }
      console.log('Category updated successfully');
      res.redirect('/category');
  });
});

const multer = require('multer');
const fs = require('fs');
const pathModule = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, pathModule.join(__dirname)); 
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    preservePath: true, 
    fileFilter: (req, file, cb) => {
        if (!req.files && file.fieldname !== 'product-images') {
            return cb(new Error('Unexpected field'));
        }
        cb(null, true);
    }
});

app.post('/', upload.array('product-images', 3), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
    }

    const { product_name, product_id, category_name, description, full_price, instant_count, product_instock } = req.body;
    const directoryName = '/newImage';

    const imagePaths = req.files.map(file => {
        return directoryName + '/' + file.originalname;
    });

    const sqlCategory = 'SELECT category_id FROM clothshop.category WHERE category_name = ?';
    connection.query(sqlCategory, [category_name], (err, categoryResult) => {
        if (err) {
            console.error('Error retrieving category ID from database:', err);
            return res.status(500).json({ error: 'Something went wrong' });
        }
        if (categoryResult.length === 0) {
            return res.status(400).json({ error: 'Invalid category name' });
        }
        const categoryId = categoryResult[0].category_id;

        const sql = 'INSERT INTO clothshop.product (product_name, product_id, category_id, product_description, product_price, product_price_promotion, product_sales_count, product_images1, product_images2, product_images3, product_instock) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        connection.query(sql, [product_name, product_id, categoryId, description, full_price, instant_count, 0, imagePaths[0], imagePaths[1], imagePaths[2], product_instock], (err, result) => {
            if (err) {
                console.error('Error inserting data into database:', err);
                return res.status(500).json({ error: 'Something went wrong' });
            }
            console.log('Data inserted into database successfully');

            req.files.forEach(file => {
                const sourcePath = pathModule.join(__dirname, file.originalname);
                const destination1 = pathModule.join(__dirname, '/newImage', file.originalname);
                const destination2 = pathModule.join(__dirname, '../Web-page/newImage', file.originalname);

                
                fs.copyFile(sourcePath, destination1, (err) => {
                    if (err) {
                        console.error('Error copying file to destination 1:', err);
                    }
                });

               
                fs.copyFile(sourcePath, destination2, (err) => {
                    if (err) {
                        console.error('Error copying file to destination 2:', err);
                    }
                });
            });

            res.redirect('/product'); 
        });
    });
});


app.get('/', (req, res) => {

  connection.query('SELECT category_name FROM category', (err, results) => {
    if (err) {
      console.error('Error fetching categories from database:', err);
      return res.status(500).send('Internal Server Error');
    }
    const categories = results.map(row => row.category_name);
    res.render('index', { categories: categories });
  });
});

app.get('/product_item/:productId', (req, res) => {
  const productId = req.params.productId;
  const sql = `
      SELECT p.*, c.category_name 
      FROM product p 
      JOIN category c ON p.category_id = c.category_id
      WHERE p.product_id = ?
  `;
  connection.query(sql, [productId], (err, results) => {
      if (err) {
          console.error('Error fetching product details:', err);
          return res.status(500).json({ error: 'Something went wrong' });
      }
      if (results.length === 0) {
          return res.status(404).json({ error: 'Product not found' });
      }
      
      results.forEach(product => {
          product.product_price = parseFloat(product.product_price);
          product.product_price_promotion = parseFloat(product.product_price_promotion);
      });
      const product = results[0];
      res.render('product_item', { product: product });
  });
});



app.post('/update_product/:productId', upload.array('product-images', 3), (req, res) => {
  const productId = req.params.productId;
  const { product_name, product_description, full_price, instant_count, product_instock, category_name } = req.body;
  const getCategorySql = `
      SELECT category_id
      FROM category
      WHERE category_name = ?
  `;
  connection.query(getCategorySql, [category_name], (err, results) => {
      if (err) {
          console.error('Error fetching category:', err);
          return res.status(500).json({ error: 'Something went wrong' });
      }
      
      if (results.length === 0) {
          return res.status(404).json({ error: 'Category not found' });
      }
      
      const categoryId = results[0].category_id;

      const updateProductSql = `
          UPDATE product 
          SET 
              product_name = ?, 
              product_description = ?, 
              product_price = ?, 
              product_price_promotion = ?, 
              product_instock = ?,
              category_id = ?
          WHERE 
              product_id = ?
      `;
      const params = [
          product_name, 
          product_description, 
          full_price, 
          instant_count, 
          product_instock,
          categoryId,
          productId
      ];

      connection.query(updateProductSql, params, (err, result) => {
          if (err) {
              console.error('Error updating product:', err);
              return res.status(500).json({ error: 'Something went wrong' });
          }
          console.log('Product updated successfully');
          res.redirect(`/product`); 
      });
  });
});

app.post('/delete_product', (req, res) => {
  const Id = req.body.product_id; 
  const sql = 'DELETE FROM clothshop.product WHERE product_id = ?'; 
  connection.query(sql, [Id], (err, result) => {
      if (err) {
          console.error('Error deleting product:', err);
          return res.status(500).json({ error: 'Something went wrong' });
      }
      console.log('Product deleted successfully');
      res.redirect('/product');
  });
});

app.get('/categories', (req, res) => {
  const sql = 'SELECT category_name FROM category';
  connection.query(sql, (err, results) => {
      if (err) {
          console.error('Error fetching category data:', err);
          return res.status(500).json({ error: 'Something went wrong' });
      }
      const categories = results.map(category => category.category_name);
      res.json(categories);
  });
});

app.listen(7817, () => {
console.log(`Server is running on port 7800`);
});


