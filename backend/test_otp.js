const https = require('https');

function sendOTP(email) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ email });
    const options = {
      hostname: 'hangloop-api.milansharma942105.workers.dev',
      port: 443,
      path: '/api/auth/send-otp',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, text: data });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

console.log('Sending real email OTP to hangloop.support@gmail.com via live Cloudflare Worker...');
sendOTP('hangloop.support@gmail.com')
  .then(res => {
    console.log('==============================================');
    console.log('API Status Code:', res.status);
    console.log('API Response:', res.data || res.text);
    console.log('==============================================');
  })
  .catch(console.error);
