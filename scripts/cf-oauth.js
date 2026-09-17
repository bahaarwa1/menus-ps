const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');

function base64url(buffer) {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

const verifier = base64url(crypto.randomBytes(32));
const challenge = base64url(crypto.createHash('sha256').update(verifier).digest());
const state = base64url(crypto.randomBytes(16));

const clientId = '54d11594-84e4-41aa-b438-e81b8fa78ee7';
const redirectUri = 'http://localhost:8976/oauth/callback';
const scope = 'account:read user:read workers:write workers_kv:write workers_routes:write workers_scripts:write workers_tail:read d1:write pages:write zone:read ssl_certs:write ai:write queues:write pipelines:write offline_access';

const authUrl = `https://dash.cloudflare.com/oauth2/auth?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${encodeURIComponent(state)}&code_challenge=${encodeURIComponent(challenge)}&code_challenge_method=S256`;

console.log('=== AUTH_URL_READY ===');
console.log(authUrl);

const server = http.createServer(async (req, res) => {
  try {
    const reqUrl = new URL(req.url, 'http://localhost:8976');
    if (reqUrl.pathname === '/oauth/callback') {
      const code = reqUrl.searchParams.get('code');

      if (!code) {
        res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h3>Error: Missing authorization code</h3>');
        return;
      }

      console.log('Received code, exchanging token with Cloudflare...');
      const tokenRes = await fetch('https://dash.cloudflare.com/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: clientId,
          code_verifier: verifier,
          code: code,
          redirect_uri: redirectUri,
        }),
      });

      const tokenData = await tokenRes.json();
      console.log('Token response:', tokenData.access_token ? 'SUCCESS' : tokenData);

      if (tokenData.access_token) {
        const configDir = path.join(os.homedir(), '.wrangler', 'config');
        if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });
        const configFile = path.join(configDir, 'default.toml');

        const expDate = new Date(Date.now() + (tokenData.expires_in || 3600) * 1000).toISOString();
        const tomlContent = `oauth_token = "${tokenData.access_token}"\nexpiration_time = "${expDate}"\nrefresh_token = "${tokenData.refresh_token || ''}"\nscopes = [\n  "account:read",\n  "user:read",\n  "workers:write",\n  "workers_kv:write",\n  "workers_routes:write",\n  "workers_scripts:write",\n  "workers_tail:read",\n  "d1:write",\n  "pages:write",\n  "zone:read",\n  "ssl_certs:write",\n  "ai:write",\n  "queues:write",\n  "pipelines:write",\n  "offline_access"\n]\n`;

        fs.writeFileSync(configFile, tomlContent, 'utf8');
        console.log('Saved Cloudflare credentials to ~/.wrangler/config/default.toml');

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
          <!DOCTYPE html>
          <html dir="rtl">
            <head><meta charset="utf-8"><title>تم تسجيل الدخول</title></head>
            <body style="font-family: sans-serif; text-align: center; padding: 60px; background: #f0fdf4; color: #166534;">
              <h1 style="font-size: 32px; margin-bottom: 15px;">✅ تم تسجيل الدخول في Cloudflare بنجاح!</h1>
              <p style="font-size: 18px; color: #15803d;">تم حفظ بيانات الاعتماد بنجاح. يمكنك الآن إغلاق هذه الصفحة والعودة للدردشة.</p>
            </body>
          </html>
        `);

        setTimeout(() => {
          server.close();
          process.exit(0);
        }, 2000);
      } else {
        res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<h3>Error exchanging token: ${JSON.stringify(tokenData)}</h3>`);
      }
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  } catch (e) {
    console.error('Handler error:', e);
    res.writeHead(500);
    res.end('Server error: ' + e.message);
  }
});

server.listen(8976, () => {
  console.log('OAuth server listening on port 8976...');
});
