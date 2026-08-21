const tls = require('tls');
const readline = require('readline');

const email = 'hangloop.support@gmail.com';
const pass = 'edgzgqgartojdvfa';

const socket = tls.connect(465, 'smtp.gmail.com', () => {
  console.log(`CONNECTING TO GMAIL SMTP WITH ${email}...`);
});

const rl = readline.createInterface({ input: socket });

let state = 'GREETING';

rl.on('line', (line) => {
  console.log('SERVER:', line);

  if (state === 'GREETING' && line.startsWith('220')) {
    state = 'EHLO';
    console.log('CLIENT: EHLO node');
    socket.write('EHLO node\r\n');
  } else if (state === 'EHLO' && line.startsWith('250 ')) {
    state = 'AUTH';
    const authString = `\0${email}\0${pass}`;
    const base64Auth = Buffer.from(authString).toString('base64');
    console.log('CLIENT: AUTH PLAIN [HIDDEN]');
    socket.write(`AUTH PLAIN ${base64Auth}\r\n`);
  } else if (state === 'AUTH') {
    if (line.startsWith('235')) {
      console.log('==============================================');
      console.log('🎉 SUCCESS! GMAIL AUTHENTICATION ACCEPTED!');
      console.log('==============================================');
      socket.end();
      process.exit(0);
    } else if (line.startsWith('535')) {
      console.log('==============================================');
      console.log('FAILED: GMAIL RETURNED BAD CREDENTIALS.');
      console.log('==============================================');
      socket.end();
      process.exit(1);
    }
  }
});
