const tls = require('tls');

const email = 'milansharma942105@gmail.com';
const pass = 'edgzgqgartojdvfa';

console.log('Testing local Node.js TLS connection to smtp.gmail.com:465...');

const socket = tls.connect(465, 'smtp.gmail.com', () => {
  console.log('Connected to Gmail SMTP server!');
});

let buffer = '';

socket.on('data', (data) => {
  const str = data.toString();
  console.log('SERVER:', str.trim());
  buffer += str;

  if (buffer.includes('220 ') && !buffer.includes('EHLO')) {
    buffer = '';
    console.log('CLIENT: EHLO node');
    socket.write('EHLO node\r\n');
  } else if (buffer.includes('250 ') && !buffer.includes('AUTH')) {
    buffer = '';
    const authString = `\0${email}\0${pass}`;
    const base64Auth = Buffer.from(authString).toString('base64');
    console.log('CLIENT: AUTH PLAIN [HIDDEN]');
    socket.write(`AUTH PLAIN ${base64Auth}\r\n`);
  } else if (buffer.includes('235 ')) {
    console.log('SUCCESS: Gmail authentication accepted!');
    socket.end();
  } else if (buffer.includes('535 ')) {
    console.log('FAILED: Gmail returned 535 Bad Credentials.');
    socket.end();
  }
});

socket.on('error', console.error);
