import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// ── Helper: collect full body from a Node IncomingMessage ─────────────────────
function collectBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function adminApiPlugin() {
  return {
    name: 'admin-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {

        // ── POST /api/shiprocket/create-order ─────────────────────────────────
        // Dev-server proxy that mirrors the Vercel serverless function.
        // Reads SHIPROCKET_EMAIL / SHIPROCKET_PASSWORD / SHIPROCKET_CHANNEL_ID
        // from the .env file (Vite loads it into process.env automatically).
        if (req.url === '/api/shiprocket/create-order' && req.method === 'POST') {
          try {
            const rawBody = await collectBody(req);
            const orderPayload = JSON.parse(rawBody);

            const srEmail = process.env.SHIPROCKET_EMAIL;
            const srPassword = process.env.SHIPROCKET_PASSWORD;
            const channelId = parseInt(process.env.SHIPROCKET_CHANNEL_ID || '0', 10);

            if (!srEmail || !srPassword) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD not set in .env' }));
              return;
            }

            // Step 1: Authenticate
            // Node 20 has native global fetch — no import needed
            const authRes = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: srEmail, password: srPassword })
            });
            const authData = await authRes.json();
            if (!authRes.ok || !authData.token) {
              res.writeHead(502, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Shiprocket auth failed', details: authData }));
              return;
            }
            const token = authData.token;

            // Step 2: Build Shiprocket payload
            const WEIGHT_PER_ITEM_KG = 0.5;
            const {
              items, orderId, orderDate, customerName,
              email, phone, address, city, state, pincode,
              country, paymentMethod, subTotal, discount, shipping
            } = orderPayload;

            const totalQuantity = items.reduce((sum, i) => sum + (i.quantity || 1), 0);
            const totalWeight = parseFloat((totalQuantity * WEIGHT_PER_ITEM_KG).toFixed(2));

            const orderItems = items.map(item => {
              const unitPrice = parseFloat(String(item.price).replace(/[^0-9.]/g, '')) || 0;
              return {
                name: `${item.title} (Size: ${item.size})`,
                sku: `HB-${item.id}-${item.size}`,
                units: item.quantity || 1,
                selling_price: unitPrice,
                discount: 0,
                tax: 0,
                hsn: 61091000
              };
            });

            const srPayload = {
              order_id: orderId,
              order_date: orderDate,
              pickup_location: 'Primary',
              billing_customer_name: customerName,
              billing_last_name: '',
              billing_address: address,
              billing_address_2: '',
              billing_city: city,
              billing_pincode: pincode,
              billing_state: state,
              billing_country: country || 'India',
              billing_email: email,
              billing_phone: phone,
              shipping_is_billing: true,
              order_items: orderItems,
              payment_method: paymentMethod === 'COD' ? 'COD' : 'Prepaid',
              shipping_charges: shipping || 0,
              giftwrap_charges: 0,
              transaction_charges: 0,
              total_discount: discount || 0,
              sub_total: subTotal,
              length: 30,
              breadth: 25,
              height: 5,
              weight: totalWeight,
              ...(channelId > 0 && { channel_id: channelId })
            };

            // Step 3: Create Shiprocket order
            const createRes = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify(srPayload)
            });
            const createData = await createRes.json();

            if (!createRes.ok) {
              res.writeHead(createRes.status, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Shiprocket order creation failed', details: createData }));
              return;
            }

            const shiprocketOrderId = createData.order_id;
            const shipmentId = createData.shipment_id;
            let awb = null;
            let courierName = 'Shiprocket';

            // Step 4: Auto-assign AWB
            if (shipmentId) {
              const awbRes = await fetch('https://apiv2.shiprocket.in/v1/external/courier/assign/awb', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ shipment_id: shipmentId })
              });
              const awbData = await awbRes.json();
              if (awbRes.ok && awbData.response && awbData.response.data) {
                awb = awbData.response.data.awb_code;
                courierName = awbData.response.data.courier_name || 'Shiprocket';
                console.log(`[Shiprocket] ✅ AWB assigned: ${awb} via ${courierName}`);
              } else {
                console.warn('[Shiprocket] AWB not immediately assigned:', awbData);
                awb = `PENDING-${shipmentId}`;
              }
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              shiprocketOrderId,
              shipmentId,
              awb: awb || `SR-${shiprocketOrderId}`,
              courier: courierName,
              status: createData.status
            }));

          } catch (err) {
            console.error('[Shiprocket Dev Proxy] Error:', err);
            res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        // ── POST /api/shiprocket/webhook ──────────────────────────────────────
        // Dev-server proxy to simulate the Vercel webhook endpoint locally
        if (req.url === '/api/shiprocket/webhook' && req.method === 'POST') {
          try {
            const rawBody = await collectBody(req);
            const payload = JSON.parse(rawBody);

            const { channel_order_id, awb, current_status, shipment_status } = payload;
            if (!channel_order_id && !awb) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Missing channel_order_id and awb' }));
              return;
            }

            const rawStatus = (current_status || shipment_status || '').toUpperCase();
            let mappedStatus = null;
            if (rawStatus === 'NEW' || rawStatus === 'MANIFESTED') mappedStatus = 'Order Received';
            else if (rawStatus === 'PICKED UP') mappedStatus = 'Manifested & Picked Up';
            else if (rawStatus === 'IN TRANSIT' || rawStatus === 'SHIPPED') mappedStatus = 'In Transit';
            else if (rawStatus === 'OUT FOR DELIVERY') mappedStatus = 'Out for Delivery';
            else if (rawStatus === 'DELIVERED') mappedStatus = 'Delivered';
            else if (rawStatus.includes('RTO') || rawStatus === 'RETURNED' || rawStatus === 'CANCELED') mappedStatus = 'Canceled / RTO';

            if (!mappedStatus) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ message: 'Ignored unrecognized status' }));
              return;
            }

            const supabaseUrl = process.env.VITE_SUPABASE_URL;
            const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

            let queryParams = `id=eq.${channel_order_id}`;
            if (!channel_order_id) queryParams = `awb=eq.${awb}`;

            const dbRes = await fetch(`${supabaseUrl}/rest/v1/orders?${queryParams}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Prefer': 'return=representation'
              },
              body: JSON.stringify({ status: mappedStatus })
            });

            if (!dbRes.ok) {
              const dbData = await dbRes.json();
              res.writeHead(502, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Database update failed', details: dbData }));
              return;
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, updatedStatus: mappedStatus }));
          } catch (err) {
            res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        // ── GET /api/products ──────────────────────────────────────────────────
        if (req.url === '/api/products' && req.method === 'GET') {
          const filePath = path.resolve(__dirname, 'src/data/products.json');
          if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf-8');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(data);
          } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify([]));
          }
          return;
        }

        // ── POST /api/products ─────────────────────────────────────────────────
        if (req.url === '/api/products' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            const filePath = path.resolve(__dirname, 'src/data/products.json');
            fs.writeFileSync(filePath, body, 'utf-8');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
          });
          return;
        }

        // ── GET /api/reviews ───────────────────────────────────────────────────
        if (req.url === '/api/reviews' && req.method === 'GET') {
          const filePath = path.resolve(__dirname, 'src/data/reviews.json');
          if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf-8');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(data);
          } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify([]));
          }
          return;
        }

        // ── POST /api/reviews ──────────────────────────────────────────────────
        if (req.url === '/api/reviews' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            const filePath = path.resolve(__dirname, 'src/data/reviews.json');
            fs.writeFileSync(filePath, body, 'utf-8');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
          });
          return;
        }

        // ── GET /api/images ────────────────────────────────────────────────────
        if (req.url === '/api/images' && req.method === 'GET') {
          const dirPath = path.resolve(__dirname, 'public/assets');
          if (fs.existsSync(dirPath)) {
            const files = fs.readdirSync(dirPath);
            const images = files.filter(file => /\.(png|jpe?g|svg|webp|gif)$/i.test(file));
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(images));
          } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify([]));
          }
          return;
        }

        // ── GET /api/feedback-images ───────────────────────────────────────────
        if (req.url === '/api/feedback-images' && req.method === 'GET') {
          const dirPath = path.resolve(__dirname, 'public/assets/feedback_images');
          if (fs.existsSync(dirPath)) {
            const files = fs.readdirSync(dirPath);
            const images = files.filter(file => /\.(png|jpe?g|svg|webp|gif)$/i.test(file));
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(images));
          } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify([]));
          }
          return;
        }

        // ── POST /api/upload ───────────────────────────────────────────────────
        if (req.url === '/api/upload' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const { filename, base64 } = JSON.parse(body);
              if (!filename || !base64) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Missing filename or base64 data' }));
                return;
              }
              const buffer = Buffer.from(base64, 'base64');
              const dirPath = path.resolve(__dirname, 'public/assets');
              if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
              }
              const filePath = path.resolve(dirPath, filename);
              fs.writeFileSync(filePath, buffer);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, url: `/assets/${filename}` }));
            } catch (err) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), adminApiPlugin()],
})
