import { createClient } from '@supabase/supabase-js';
import * as http from 'http';
import * as crypto from 'crypto';
const supabaseUrl = 'https://qmxhcjiryoptyzpmysen.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFteGhjamlyeW9wdHl6cG15c2VuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzY0MTQ1MiwiZXhwIjoyMDc5MjE3NDUyfQ.fMA1oqEbzHn6uYsZ9cdO8iIFDnr_xhLujAfTyb7k-ok';
const supabase = createClient(supabaseUrl, supabaseServiceKey);
const PORT = 3099;
function generateDeviceCode() {
    return crypto.randomBytes(16).toString('hex');
}
function generateUserCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
function generateToken() {
    return `codra_${crypto.randomBytes(32).toString('hex')}`;
}
const server = http.createServer(async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    const url = new URL(req.url || '/', `http://localhost:${PORT}`);
    // Handle device auth start
    if (req.method === 'POST' && url.pathname === '/api/codra/auth/device/start') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
            try {
                const deviceCode = generateDeviceCode();
                const userCode = generateUserCode();
                const expiresIn = 5 * 60 * 1000;
                const expiresAt = new Date(Date.now() + expiresIn).toISOString();
                const { error } = await supabase
                    .from('codra_device_auth_sessions')
                    .insert({
                    device_code: deviceCode,
                    user_code: userCode,
                    status: 'pending',
                    expires_at: expiresAt
                });
                if (error) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: error.message }));
                    return;
                }
                const verificationUrl = `https://teraai.chat/auth/signin?source=codra-code&device_code=${deviceCode}&redirect_to=${encodeURIComponent('/codra-code/auth/success?device_code=' + deviceCode)}`;
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    device_code: deviceCode,
                    user_code: userCode,
                    verification_url: verificationUrl,
                    expires_at: expiresAt,
                    interval: 2
                }));
            }
            catch (e) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }
    // Handle device auth poll
    if (req.method === 'POST' && url.pathname === '/api/codra/auth/device/poll') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
            try {
                const { device_code } = JSON.parse(body);
                const { data, error } = await supabase
                    .from('codra_device_auth_sessions')
                    .select('*')
                    .eq('device_code', device_code)
                    .single();
                if (error || !data) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, status: 'pending' }));
                    return;
                }
                if (new Date(data.expires_at) < new Date()) {
                    await supabase
                        .from('codra_device_auth_sessions')
                        .update({ status: 'expired', updated_at: new Date().toISOString() })
                        .eq('device_code', device_code);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, status: 'expired' }));
                    return;
                }
                if (data.status === 'approved') {
                    const token = generateToken();
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: true,
                        status: 'approved',
                        token: token,
                        email: data.email || 'user@teraai.chat',
                        user_id: data.user_id || crypto.randomUUID(),
                        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                    }));
                    return;
                }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, status: data.status }));
            }
            catch (e) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }
    // Handle device auth approve
    if (req.method === 'POST' && url.pathname === '/api/codra/auth/device/approve') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
            try {
                const { device_code } = JSON.parse(body);
                // For demo purposes, approve any device code without user_id FK
                const { error } = await supabase
                    .from('codra_device_auth_sessions')
                    .update({
                    status: 'approved',
                    email: 'demo@example.com',
                    approved_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                    .eq('device_code', device_code)
                    .eq('status', 'pending');
                if (error) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: error.message }));
                    return;
                }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    message: 'Device session approved'
                }));
            }
            catch (e) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }
    // Handle success page
    if (req.method === 'GET' && url.pathname === '/codra-code/auth/success') {
        const deviceCode = url.searchParams.get('device_code');
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Codra Code Authenticated</title>
        <style>
          body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f5f5f5; }
          .card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
          .success { color: #16a34a; }
          .btn { background: #2563eb; color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; display: inline-block; margin-top: 1rem; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1 class="success">✓ Codra Code Authenticated</h1>
          <p>You are authenticated with Tera. You can return to your terminal.</p>
          <p style="color: #666; font-size: 0.875rem;">Run <code>codra-code auth status</code> to verify.</p>
          <a href="/" class="btn">Return to Tera Dashboard</a>
        </div>
        <script>
          ${deviceCode ? `
            fetch('/api/codra/auth/device/approve', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ device_code: '${deviceCode}' })
            }).then(r => r.json()).then(data => {
              if (data.success) {
                console.log('Device approved');
              }
            });
          ` : ''}
        </script>
      </body>
      </html>
    `);
        return;
    }
    // Default response
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
});
server.listen(PORT, () => {
    console.log(`Auth server running on http://localhost:${PORT}`);
    console.log('Endpoints:');
    console.log(`  POST http://localhost:${PORT}/api/codra/auth/device/start`);
    console.log(`  POST http://localhost:${PORT}/api/codra/auth/device/poll`);
    console.log(`  POST http://localhost:${PORT}/api/codra/auth/device/approve`);
    console.log(`  GET  http://localhost:${PORT}/codra-code/auth/success?device_code=<code>`);
});
