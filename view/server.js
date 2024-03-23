const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const axios = require('axios');
const mysql = require('mysql2');
const ejs = require('ejs'); 
const { connect } = require('http2');
 

const app = express();
 
app.use(express.static("public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
 
 
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Mtck1234*',
    database: 'clothshop'
  });
  
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL database:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// / Set EJS as the view engine
app.set('view engine', 'ejs');
// Specify the directory where your views are located
app.set('views', __dirname + '/views');
 
 
// Define products array
const products = [
    { product_id: 101, product_name: 'Le grand Bambino'},
    { product_id: 102, product_name: 'Le petit panier soli' }
];
 
// Serve static files
app.use(express.static(__dirname));
 
// Homepage route
app.get('/', (req, res) => {
    res.sendFile(__dirname + "/html/Homepage.html");
});
 
// Login/register route
app.post('/', (req, res) => {
    // Your login/register logic using Axios
});
 
// Products route
app.get('/products', (req, res) => {
    res.render('product.ejs', { products: products });
});
 
// Endpoint to handle adding a product to the wishlist
app.post('/addwishlist', (req, res) => {
    // Retrieve the productId and productName from the request body
    const { productId } = req.body;
 
    // Insert the productId and productName into the wishlist table in your MySQL database
    const sql = `INSERT INTO wishlist (product_id) VALUES (?)`;
    connection.query(sql, [productId], (error, results) => {
        if (error) {
            // Log the error
            console.error('Error adding product to wishlist:', error);
            // Send an error response
            res.status(500).json({ error: 'Failed to add product to wishlist' });
        } else {
            // Log success message
            console.log('Product added to wishlist:', productId);
            // Send a success response
            res.status(200).json({ message: 'Product added to wishlist successfully' });
        }
    });
});
// app.post("/addwishlist", async (req, res) => {
//     //const user = await UserDB.findById(req.session.userId);
   
//     console.log("session-/addwishlist: ", req.sessionID);
   
//     // collect user input from the VIEW
//     //await const wishingProducts = req.body.box;
   
//     req.session.wish = req.body.box;
   
//     console.log("session-/addwishlist: ", req.session);
   
//     const user = await UserDB.findById(req.session.userId);
//     let products = await ProductDB.findAll();
//     let user_wishlists = req.session.wish;
   
//     // use res.render to load up an ejs view file
//     res.render("wishlist", {
//       products: products,
//       user: user,
//       wishlists: user_wishlists,
//     });
   
//   });
 
// Failure route
app.post('/failure', (req, res) => {
    res.redirect('/');
});

 
app.get('/Bag', (req, res) => {
    const sql = 'SELECT * FROM product WHERE category_id = 1';

    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching product data:', err);
            return res.status(500).json({ error: 'Something went wrong' });
        }
        results.forEach(product => {
            product.product_price = parseFloat(product.product_price); 
        });
        res.render('Bag', { products: results });
    });
});

app.get('/Top', (req, res) => {
    const sql = 'SELECT * FROM product WHERE category_id = 2';

    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching product data:', err);
            return res.status(500).json({ error: 'Something went wrong' });
        }
        results.forEach(product => {
            product.product_price = parseFloat(product.product_price); 
        });
        res.render('Top', { products: results });
    });
});

app.get('/Shoes', (req, res) => {
    const sql = 'SELECT * FROM product WHERE category_id = 3';

    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching product data:', err);
            return res.status(500).json({ error: 'Something went wrong' });
        }
        results.forEach(product => {
            product.product_price = parseFloat(product.product_price); 
        });
        res.render('Shoes', { products: results });
    });
});

app.get('/Trousersnshorts', (req, res) => {
    const sql = 'SELECT * FROM product WHERE category_id = 4';

    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching product data:', err);
            return res.status(500).json({ error: 'Something went wrong' });
        }
        results.forEach(product => {
            product.product_price = parseFloat(product.product_price); 
        });
        res.render('Trousersnshorts', { products: results });
    });
});

app.get('/wishlist', (req, res) => {
    const removeDuplicatesSQL = `
        DELETE FROM wishlist
        WHERE product_id IN (
            SELECT product_id FROM (
                SELECT product_id FROM wishlist
                WHERE product_id IN (
                    SELECT product_id FROM wishlist
                    GROUP BY product_id
                    HAVING COUNT(*) > 1
                )
            ) AS temp
        )
    `;
     connection.query(removeDuplicatesSQL, (err, _) => {
        if (err) {
            console.error('Error removing duplicate entries from wishlist table:', err);
            return res.status(500).json({ error: 'Something went wrong' });
        }
        
         const fetchWishlistSQL = `
            SELECT w.product_id, p.product_name, p.product_images1, p.product_price 
            FROM wishlist w 
            JOIN product p ON w.product_id = p.product_id
        `;
        
         connection.query(fetchWishlistSQL, (err, results) => {
            if (err) {
                console.error('Error fetching wishlist items:', err);
                return res.status(500).json({ error: 'Something went wrong' });
            }
            
            results.forEach(product => {
                product.product_price = parseFloat(product.product_price); 
            });
            
              res.render('wishlist', { wishlistItems: results });
        });
    });
});

function calculateTotalPages(totalProducts, productsPerPage) {
    return Math.ceil(totalProducts / productsPerPage);
}
 

app.get('/productall', (req, res) => {
    const sql = 'SELECT COUNT(*) AS totalProducts FROM product'; // Query to get the total number of products
    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching product count:', err);
            return res.status(500).json({ error: 'Something went wrong' });
        }
        const totalProducts = results[0].totalProducts;
        const currentPage = parseInt(req.query.page) || 1;
        const productsPerPage = 12;
        const totalPages = calculateTotalPages(totalProducts, productsPerPage);
 
        const offset = (currentPage - 1) * productsPerPage;
        const limit = productsPerPage;
 
        const productQuery = `SELECT * FROM product LIMIT ${limit} OFFSET ${offset}`;
        connection.query(productQuery, (err, products) => {
            if (err) {
                console.error('Error fetching product data:', err);
                return res.status(500).json({ error: 'Something went wrong' });
            }
            products.forEach(product => {
                product.product_price = parseFloat(product.product_price);
            });
            res.render('productall', { products, currentPage, totalPages });
        });
    });
});




app.get('/product_detail/:productId', (req, res) => {
    const productId = req.params.productId;
    const sql = 'SELECT * FROM product WHERE product_id = ?';
    connection.query(sql, [productId], (err, results) => {
        if (err) {
            console.error('Error fetching product data:', err);
            return res.status(500).json({ error: 'Something went wrong' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const cartSql = `
            SELECT p.product_images1, p.product_name, p.product_price, c.product_quantity,c.product_name, c.product_price, c.cart_id, c.product_size, p.product_id
            FROM product AS p
            INNER JOIN cart AS c ON p.product_name = c.product_name`; 

        connection.query(cartSql, (err, cartItems) => {
            if (err) {
                console.error('Error fetching cart items:', err);
                return res.status(500).json({ error: 'Something went wrong' });
            }
        
            

            res.render('product_detail', { product: results[0], cartItems });
        });
    });
});


app.post('/add_to_cart', (req, res) => {
    const {
        product_name,
        product_size,
        product_quantity,
        product_price,
        cart_id
    } = req.body;
   
    const sqlProductId = 'SELECT product_id FROM product WHERE product_name = ?';
    connection.query(sqlProductId, [product_name], (err, results) => {
        if (err) {
            console.error('Error fetching product_id:', err);
            return res.status(500).json({ error: 'Something went wrong' });
        }
        if (results.length === 0) {
            console.error('Product not found:', product_name);
            return res.status(404).json({ error: 'Product not found' });
        }
       
        const productId = results[0].product_id;
        const sqlInsertCart = 'INSERT INTO cart (cart_id, product_name, product_size, product_quantity, product_price) VALUES (?, ?, ?, ?, ?)';
connection.query(sqlInsertCart, [cart_id, product_name, product_size, product_quantity, product_price], (err, insertResults) => {
    if (err) {
                console.error('Error adding product to cart:', err);
                return res.status(500).json({ error: 'Something went wrong' });
            }
            console.log('Product added to cart successfully');
            
            // Redirect back to the product detail page after adding the product to the cart
            res.redirect(`/product_detail/${productId}`);
        });
    });
});

app.post('/remove_from_cart', (req, res) => {
    const { cart_id } = req.body;
    const sql = 'SELECT product_name FROM cart WHERE cart_id = ?';
    connection.query(sql, [cart_id], (err, results) => {
        if (err) {
            console.error('Error fetching product_name from cart:', err);
            return res.status(500).json({ error: 'Something went wrong' });
        }
        if (results.length === 0) {
            console.error('Product not found for cart_id:', cart_id);
            return res.status(404).json({ error: 'Product not found in cart' });
        }

        const productName = results[0].product_name;
        const sqlProductId = 'SELECT product_id FROM product WHERE product_name = ?';
        connection.query(sqlProductId, [productName], (err, productResults) => {
            if (err) {
                console.error('Error fetching product_id from product:', err);
                return res.status(500).json({ error: 'Something went wrong' });
            }
            if (productResults.length === 0) {
                console.error('Product not found in product table:', productName);
                return res.status(404).json({ error: 'Product not found in product table' });
            }

            const productId = productResults[0].product_id;

            const deleteSql = 'DELETE FROM cart WHERE cart_id = ?';
            connection.query(deleteSql, [cart_id], (err, deleteResult) => {
                if (err) {
                    console.error('Error deleting product from cart:', err);
                    return res.status(500).json({ error: 'Something went wrong' });
                }
                console.log('Product deleted successfully from cart');

                res.redirect(`/product_detail/${productId}`);
            });
        });
    });
});


app.post('/register', (req, res) => {
    const { email, firstname, lastname, password, confirmpassword } = req.body;
  
    if (password !== confirmpassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }
  
    const sql = 'INSERT INTO registcus (email, firstname, lastname, password) VALUES (?, ?, ?, ?)';
    connection.query(sql, [email, firstname, lastname, password], (err, result) => {
      if (err) {
        console.error('Error registering user:', err);
        return res.status(500).json({ error: 'Something went wrong' });
      }
      console.log('User registered successfully');
     
      res.redirect('/html/Account/login.html');
    });
  });
  app.post('/login', (req, res) => {
    const { email, password } = req.body;
 
    const sql = 'SELECT * FROM registcus WHERE email = ? AND password = ?';
    connection.query(sql, [email, password], (err, results) => {
        if (err) {
            console.error('Error during login:', err);
            return res.status(500).json({ error: 'Something went wrong' });
        }
 
        if (results.length === 1) {
            // Login successful, redirect to homepage
            res.redirect("/profile");
 
            // Insert login data into loginmyshop table
            const user = results[0];
            const insertSql = 'INSERT INTO logincus (email, password) VALUES (?, ?)';
            connection.query(insertSql, [user.email, user.password], (insertErr, insertResult) => {
                if (insertErr) {
                    console.error('Error storing login data:', insertErr);
                } else {
                    console.log('Login data stored successfully');
                }
            });
        } else {
            // Incorrect email or password, redirect back to login page with error
            res.redirect('/?error=1');
            console.log('wrong email or password');
        }
    });
});
 
app.get('/profile', (req, res) => {
    const sql = `
       SELECT r.firstname, l.email, l.password
       FROM registcus AS r
       INNER JOIN logincus AS l ON r.email = l.email
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
           res.render('profile', { user });
       } else {
           res.status(404).send('User not found');
       }
   });
  });

app.post('/checkout', (req, res) => {
    // Fetch cart items with product details from the database
    const sql = `
        SELECT c.cart_id, p.product_id, c.product_price, c.product_quantity 
        FROM cart c 
        JOIN product p ON c.product_name = p.product_name
    `;

    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching cart items:', err);
            return res.status(500).json({ error: 'Failed to fetch cart items' });
        }

        // Check if results is not null and is iterable
        if (!results || !Array.isArray(results)) {
            console.error('Error fetching cart items:', results);
            return res.status(500).json({ error: 'Failed to fetch cart items' });
        }

        // Calculate total bill price
        let totalPrice = 0;
        results.forEach(item => {
            // Convert product_price to numeric type before calculation
            const productPrice = parseFloat(item.product_price);
            totalPrice += productPrice * item.product_quantity;
        });

        // Prepare the values for insertion into the bill table
        const values = results.map(item => {
            const productPrice = parseFloat(item.product_price);
            return [item.product_id, item.product_quantity, (productPrice * item.product_quantity)];
        });

        // Insert the bill into the bill table
        const insertSql = 'INSERT INTO bill (product_id, number_of_items, bill_price) VALUES ?';
        connection.query(insertSql, [values], (error, result) => {
            if (error) {
                console.error('Error inserting bill:', error);
                return res.status(500).json({ error: 'Failed to insert bill' });
            }

            // Delete cart items after successful checkout
            const deleteCartItemsSql = 'DELETE FROM cart';
            connection.query(deleteCartItemsSql, (deleteError, deleteResult) => {
                if (deleteError) {
                    console.error('Error deleting cart items:', deleteError);
                    return res.status(500).json({ error: 'Failed to delete cart items' });
                }

                res.redirect(`/html/Homepage.html`);  });
        });
    });
});



  app.get('/categories', (req, res) => {
    const fetchCategoriesSQL = 'SELECT * FROM category';
    connection.query(fetchCategoriesSQL, (err, results) => {
        if (err) {
            console.error('Error fetching categories:', err);
            return res.status(500).json({ error: 'Something went wrong' });
        }
        res.json(results);
    });
});
  
app.get('/default_category_layout', (req, res) => {
    const categoryId = req.query.category_id;
    const categoryName = req.query.category_name;

    if (!categoryId || !categoryName) {
        return res.status(400).json({ error: 'Category ID or name is missing' });
    }

    const sql = `SELECT * FROM product WHERE category_id = ?`;

    connection.query(sql, [categoryId], (err, results) => {
        if (err) {
            console.error('Error fetching product data:', err);
            return res.status(500).json({ error: 'Something went wrong' });
        }

        results.forEach(product => {
            product.product_price = parseFloat(product.product_price);
        });
           res.render('default_category_layout', {
            category_id: categoryId,
            category_name: categoryName,
            products: results
        });
    });
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/html/Homepage.html');
  });
  app.post('/sub', (req, res) => {
      const email = req.body.email;
   
      const listId = 'bb6af78495';
      const apiKey = '77ec684138a9f0a747ba12dedd4af83e-us14';
   
      const config = {
          method: "post",
          url: `https://us14.api.mailchimp.com/3.0/lists/${listId}`,
          auth: {
              username: 'anyname',
              password: apiKey,
          },
          data: {
              members: [
                  {
                      email_address: email,
                      status: 'subscribed',
                 
                  },
              ],
          },
      };
   
      axios(config)
          .then(response => {
              if (response.status === 200 && response.data.error_count === 0) {
                  console.log(`New Member :`, req.body.email);
                  res.sendFile(__dirname + '/html/success.html');
              } else {
                  console.log(`something went wrong`);
                  res.sendFile(__dirname + '/html/failure.html');
              }
          }
          )
          .catch(error => {
              console.error(error);
            });
  });
  
  app.post('/update_quantity', (req, res) => {
    const { cartId, newQuantity } = req.body;
    const sql = 'UPDATE cart SET product_quantity = ? WHERE cart_id = ?';
    connection.query(sql, [newQuantity, cartId], (err, result) => {
        if (err) {
            console.error('Error updating quantity:', err);
            res.status(500).send('Error updating quantity');
        } else {
            console.log('Quantity updated successfully');
            res.status(200).send('Quantity updated successfully');
        }
    });
});


// Start the server
const port = 28000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
 