// server/routes/productRoutes.js
import express from 'express';
import verifySellerJWT from '../middleware/verifySellerJWT.js';

export default function createProductRoutes(db, upload) {
  const router = express.Router();

  // GET all products (public)
  router.get('/', (req, res) => {
    db.all('SELECT * FROM products', (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });
  // GET products for logged-in seller
  router.get('/my-products', verifySellerJWT, (req, res) => {
    const { id: sellerId } = req.seller;
    
    db.all('SELECT * FROM products WHERE seller_id = ?', [sellerId], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  // GET a single product by ID (public)
  router.get('/:id', (req, res) => {
    const productId = req.params.id;

    db.get('SELECT * FROM products WHERE id = ?', [productId], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: 'Product not found' });
      res.json(row);
    });
  });
    // GET a single product by ID (public or protected as needed)
  // router.get('/:id', (req, res) => {
  //   const productId = req.params.id;
    
  //   db.get('SELECT * FROM products WHERE id = ?', [productId], (err, row) => {
  //     if (err) return res.status(500).json({ error: err.message });
  //     if (!row) return res.status(404).json({ error: 'Product not found' });
  //     res.json(row);
  //   });
  // });

  // POST a new product (protected)
  router.post('/', verifySellerJWT, upload.single('image'), (req, res) => {
    const {
      title, description, price, discount, discount_validity,
      category, brand, stock, tags,
      deliverycharge_inside, deliverycharge_outside
    } = req.body;

    const { shopName, shopDetails = null, id: sellerId } = req.seller;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    // Validate essential fields
    if (!title || !price || !category || !stock) {
      return res.status(400).json({ error: 'Title, price, category, and stock are required.' });
    }

    const numericPrice = parseFloat(price);
    const numericDiscount = parseFloat(discount || 0);
    const final_price = numericPrice - (numericPrice * (numericDiscount / 100));

    const sql = `
      INSERT INTO products (
        title, description, price, discount, discount_validity, final_price,
        category, brand, stock, deliverycharge_inside, deliverycharge_outside,
        sold, rating, total_rating, reviews,
        shopname, shopdetails, tags, image, seller_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '{}', '{}', '{}', '{}', ?, ?, ?, ?, ?)
    `;

    const params = [
      title, description, numericPrice, numericDiscount, discount_validity, final_price,
      category, brand, stock, deliverycharge_inside, deliverycharge_outside,
      shopName, shopDetails, tags, image, sellerId
    ];

    db.run(sql, params, function (err) {
      if (err) {
        console.error('Error inserting product:', err.message);
        return res.status(500).json({ error: err.message });
      }
      res.json({ 
        message: 'Product created', 
        id: this.lastID,
        product: {
          id: this.lastID,
          title,
          price: numericPrice,
          discount: numericDiscount,
          final_price,
          category,
          stock,
          image,
          seller_id: sellerId
        }
      });
    });
  });

  // UPDATE a product (protected)
  router.put('/:id', verifySellerJWT, upload.single('image'), (req, res) => {
    const productId = req.params.id;
    const {
      title, description, price, discount, discount_validity,
      category, brand, stock, tags,
      deliverycharge_inside, deliverycharge_outside
    } = req.body;

    const { id: sellerId } = req.seller;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    const updates = [];
    const params = [];

    // Dynamically add fields to update
    if (title !== undefined) { updates.push('title = ?'); params.push(title); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (category !== undefined) { updates.push('category = ?'); params.push(category); }
    if (brand !== undefined) { updates.push('brand = ?'); params.push(brand); }
    if (stock !== undefined) { updates.push('stock = ?'); params.push(parseInt(stock)); }
    if (tags !== undefined) { updates.push('tags = ?'); params.push(tags); }
    if (deliverycharge_inside !== undefined) { 
      updates.push('deliverycharge_inside = ?'); 
      params.push(parseFloat(deliverycharge_inside)); 
    }
    if (deliverycharge_outside !== undefined) { 
      updates.push('deliverycharge_outside = ?'); 
      params.push(parseFloat(deliverycharge_outside)); 
    }
    if (discount_validity !== undefined) { 
      updates.push('discount_validity = ?'); 
      params.push(discount_validity); 
    }
    if (image) { updates.push('image = ?'); params.push(image); }

    // Fetch the product to verify ownership
    db.get('SELECT id, seller_id FROM products WHERE id = ?', [productId], (err, product) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!product) return res.status(404).json({ error: 'Product not found' });
      
      // Verify ownership using seller_id
      if (product.seller_id !== sellerId) {
        return res.status(403).json({ error: 'Forbidden: You do not own this product' });
      }

      // Handle price and discount together for final_price calculation
      let newPrice = price !== undefined ? parseFloat(price) : undefined;
      let newDiscount = discount !== undefined ? parseFloat(discount || 0) : undefined;

      // Add price and discount to updates array if they were provided
      if (price !== undefined) { updates.push('price = ?'); params.push(newPrice); }
      if (discount !== undefined) { updates.push('discount = ?'); params.push(newDiscount); }

      // Calculate final_price if price or discount changed
      if (price !== undefined || discount !== undefined) {
        // If only one is provided, we need to get the current value of the other
        if (price === undefined || discount === undefined) {
          db.get('SELECT price, discount FROM products WHERE id = ?', [productId], (err, current) => {
            if (err) return res.status(500).json({ error: err.message });
            
            const calcPrice = price !== undefined ? newPrice : current.price;
            const calcDiscount = discount !== undefined ? newDiscount : current.discount;
            const newFinalPrice = calcPrice - (calcPrice * (calcDiscount / 100));
            
            updates.push('final_price = ?');
            params.push(newFinalPrice);
            completeUpdate();
          });
        } else {
          const newFinalPrice = newPrice - (newPrice * (newDiscount / 100));
          updates.push('final_price = ?');
          params.push(newFinalPrice);
          completeUpdate();
        }
      } else {
        completeUpdate();
      }

      function completeUpdate() {
        if (updates.length === 0) {
          return res.status(400).json({ error: 'No valid fields to update' });
        }

        params.push(productId); // Add product ID for the WHERE clause

        const sql = `UPDATE products SET ${updates.join(', ')} WHERE id = ?`;

        db.run(sql, params, function (err) {
          if (err) {
            console.error('Error updating product:', err.message);
            return res.status(500).json({ error: err.message });
          }
          
          // Return the updated product
          db.get('SELECT * FROM products WHERE id = ?', [productId], (err, updatedProduct) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Product updated successfully', product: updatedProduct });
          });
        });
      }
    });
  });

  // DELETE a product (protected)
  router.delete('/:id', verifySellerJWT, (req, res) => {
    const productId = req.params.id;
    const { id: sellerId } = req.seller;
    
    // Verify ownership before deletion
    db.get('SELECT id, seller_id FROM products WHERE id = ?', [productId], (err, product) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!product) return res.status(404).json({ error: 'Product not found' });
      
      if (product.seller_id !== sellerId) {
        return res.status(403).json({ error: 'Forbidden: You do not own this product' });
      }
      
      db.run('DELETE FROM products WHERE id = ?', [productId], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Product deleted', changes: this.changes });
      });
    });
  });

  return router;
}