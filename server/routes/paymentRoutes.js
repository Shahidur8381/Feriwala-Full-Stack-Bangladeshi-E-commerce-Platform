import express from 'express';
import SSLCommerzPayment from 'sslcommerz-lts';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
dotenv.config();

const createPaymentRoutes = (db) => {
  const router = express.Router();
  const pool = db.pool;

  const store_id = process.env.SSLCZ_STORE_ID || 'testbox';
  const store_passwd = process.env.SSLCZ_STORE_PASSWORD || 'qwerty';
  const is_live = process.env.SSLCZ_IS_LIVE === 'true';
  const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
  const SERVER_URL = `http://localhost:${process.env.PORT || 5000}`;

  // ── POST /api/payment/ssl-init ─────────────────────────────────────────────
  // Initiates an SSLCommerz session and returns the redirect URL
  router.post('/ssl-init', async (req, res) => {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'orderId is required' });
    }

    try {
      // Fetch order details
      const { rows } = await pool.query('SELECT * FROM orders WHERE orderid = $1', [orderId]);
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }
      const order = rows[0];

      if (order.status !== 'unpaid') {
        return res.status(400).json({ error: 'Order is not eligible for payment', currentStatus: order.status });
      }

      const tranId = `SSL-${orderId.slice(0, 8)}-${Date.now()}`;

      const data = {
        total_amount: order.total,
        currency: 'BDT',
        tran_id: tranId,
        success_url: `${SERVER_URL}/api/payment/ssl-success?orderId=${orderId}`,
        fail_url: `${SERVER_URL}/api/payment/ssl-fail?orderId=${orderId}`,
        cancel_url: `${SERVER_URL}/api/payment/ssl-cancel?orderId=${orderId}`,
        ipn_url: `${SERVER_URL}/api/payment/ssl-ipn`,
        shipping_method: 'Courier',
        product_name: 'FeriWala Order',
        product_category: 'General',
        product_profile: 'general',
        cus_name: order.customername || 'Customer',
        cus_email: order.customeremail || 'customer@example.com',
        cus_add1: order.customeraddress || 'Dhaka',
        cus_add2: '',
        cus_city: 'Dhaka',
        cus_state: 'Dhaka',
        cus_postcode: '1000',
        cus_country: 'Bangladesh',
        cus_phone: order.customerphone || '01700000000',
        cus_fax: '',
        ship_name: order.customername || 'Customer',
        ship_add1: order.customeraddress || 'Dhaka',
        ship_add2: '',
        ship_city: 'Dhaka',
        ship_state: 'Dhaka',
        ship_postcode: '1000',
        ship_country: 'Bangladesh',
      };

      const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
      const apiResponse = await sslcz.init(data);

      if (apiResponse?.GatewayPageURL) {
        // Store tran_id in the order so we can verify later
        await pool.query(
          'UPDATE orders SET transactionid = $1 WHERE orderid = $2',
          [tranId, orderId]
        );
        res.json({ url: apiResponse.GatewayPageURL, tranId });
      } else {
        console.error('SSLCommerz init failed:', apiResponse);
        res.status(500).json({ error: 'Failed to initiate payment gateway', details: apiResponse });
      }
    } catch (err) {
      console.error('SSLCommerz error:', err.message);
      res.status(500).json({ error: 'Payment gateway error', message: err.message });
    }
  });

  // ── POST /api/payment/ssl-success ─────────────────────────────────────────
  // SSLCommerz redirects here on successful payment (POST with form data)
  router.post('/ssl-success', async (req, res) => {
    let { orderId } = req.query;
    console.log('SSL Success Payload:', req.body);
    const { val_id, tran_id, status } = req.body;

    try {
      // If orderId is missing from query, recover it from the database using tran_id
      if (!orderId && tran_id) {
        const { rows } = await pool.query('SELECT orderid FROM orders WHERE transactionid = $1', [tran_id]);
        if (rows.length > 0) {
          orderId = rows[0].orderid;
        }
      }

      if (status !== 'VALID' && status !== 'VALIDATED') {
        console.warn(`Invalid status from SSLCommerz: ${status}`);
        return res.redirect(`${CLIENT_URL}/payment-failed?orderId=${orderId || ''}&reason=invalid_status`);
      }

      // Validate the transaction with SSLCommerz
      const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
      const validationResponse = await sslcz.validate({ val_id });

      if (validationResponse?.status === 'VALID' || validationResponse?.status === 'VALIDATED') {
        // Update order status to 'paid'
        await pool.query(
          `UPDATE orders SET status = 'paid', paymentstatus = 'paid', paymentmethod = 'sslcommerz' WHERE transactionid = $1`,
          [tran_id]
        );
        // Redirect to success page on client
        res.redirect(`${CLIENT_URL}/payment-success?orderId=${orderId}`);
      } else {
        res.redirect(`${CLIENT_URL}/payment-failed?orderId=${orderId}&reason=validation_failed`);
      }
    } catch (err) {
      console.error('SSL success handler error:', err.message);
      res.redirect(`${CLIENT_URL}/payment-failed?orderId=${orderId || ''}&reason=server_error`);
    }
  });

  // ── POST /api/payment/ssl-fail ────────────────────────────────────────────
  router.post('/ssl-fail', async (req, res) => {
    let { orderId } = req.query;
    const { tran_id } = req.body;
    if (!orderId && tran_id) {
      const { rows } = await pool.query('SELECT orderid FROM orders WHERE transactionid = $1', [tran_id]);
      if (rows.length > 0) orderId = rows[0].orderid;
    }
    res.redirect(`${CLIENT_URL}/payment-failed?orderId=${orderId || ''}&reason=payment_failed`);
  });

  // ── POST /api/payment/ssl-cancel ──────────────────────────────────────────
  router.post('/ssl-cancel', async (req, res) => {
    let { orderId } = req.query;
    const { tran_id } = req.body;
    if (!orderId && tran_id) {
      const { rows } = await pool.query('SELECT orderid FROM orders WHERE transactionid = $1', [tran_id]);
      if (rows.length > 0) orderId = rows[0].orderid;
    }
    res.redirect(`${CLIENT_URL}/payment/${orderId || ''}?cancelled=true`);
  });

  // ── POST /api/payment/ssl-ipn ─────────────────────────────────────────────
  // Instant Payment Notification (background verification by SSLCommerz)
  router.post('/ssl-ipn', async (req, res) => {
    const { val_id, tran_id, status } = req.body;
    try {
      if (status === 'VALID' || status === 'VALIDATED') {
        const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
        const validationResponse = await sslcz.validate({ val_id });
        if (validationResponse?.status === 'VALID' || validationResponse?.status === 'VALIDATED') {
          // Find and update the order by transactionid
          await pool.query(
            `UPDATE orders SET status = 'paid', paymentstatus = 'paid', paymentmethod = 'sslcommerz' WHERE transactionid = $1`,
            [tran_id]
          );
        }
      }
      res.status(200).send('OK');
    } catch (err) {
      console.error('IPN error:', err.message);
      res.status(200).send('OK'); // Always respond 200 to IPN
    }
  });

  return router;
};

export default createPaymentRoutes;
