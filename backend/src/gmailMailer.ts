import { connect } from 'cloudflare:sockets';

export async function sendGmailOTP(
  gmailEmail: string,
  gmailAppPassword: string,
  toEmail: string,
  otpCode: string
): Promise<{ success: boolean; error?: string }> {
  const cleanEmail = (gmailEmail || '').trim();
  const cleanPassword = (gmailAppPassword || '').trim().replace(/\s+/g, '');

  if (!cleanEmail || !cleanPassword) {
    return { success: false, error: 'Gmail credentials (GMAIL_EMAIL & GMAIL_APP_PASSWORD) not configured.' };
  }

  let socket: any = null;

  try {
    socket = connect({
      hostname: 'smtp.gmail.com',
      port: 465,
    }, {
      secureTransport: 'on',
      allowHalfOpen: false
    } as any);

    const writer = socket.writable.getWriter();
    const reader = socket.readable.getReader();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    let readBuffer = '';

    const readLine = async (): Promise<string> => {
      while (!readBuffer.includes('\n')) {
        const { value, done } = await reader.read();
        if (done) break;
        readBuffer += decoder.decode(value, { stream: true });
      }
      const lineEnd = readBuffer.indexOf('\n');
      if (lineEnd === -1) {
        const remaining = readBuffer;
        readBuffer = '';
        return remaining;
      }
      const line = readBuffer.substring(0, lineEnd + 1);
      readBuffer = readBuffer.substring(lineEnd + 1);
      return line;
    };

    const sendCmd = async (cmd: string): Promise<string> => {
      await writer.write(encoder.encode(cmd + '\r\n'));
      let response = '';
      while (true) {
        const line = await readLine();
        response += line;
        if (line.length >= 4 && line[3] === ' ') {
          break;
        }
      }
      return response;
    };

    // Server Greeting
    const greeting = await readLine();
    if (!greeting.startsWith('220')) {
      throw new Error(`Invalid SMTPS greeting: ${greeting}`);
    }

    // EHLO
    const ehloRes = await sendCmd('EHLO worker.hangloop');
    if (!ehloRes.startsWith('250')) {
      throw new Error(`EHLO failed: ${ehloRes}`);
    }

    // AUTH PLAIN (\0user\0pass)
    const rawAuthBytes = new Uint8Array([
      0,
      ...encoder.encode(cleanEmail),
      0,
      ...encoder.encode(cleanPassword)
    ]);
    
    let binary = '';
    for (let i = 0; i < rawAuthBytes.byteLength; i++) {
      binary += String.fromCharCode(rawAuthBytes[i]);
    }
    const base64Auth = btoa(binary);

    const authRes = await sendCmd(`AUTH PLAIN ${base64Auth}`);
    if (!authRes.startsWith('235')) {
      if (authRes.includes('535')) {
        throw new Error(`Gmail SMTPS 535: Bad credentials or 2FA App Password expired for ${cleanEmail}.`);
      }
      throw new Error(`Gmail authentication failed: ${authRes}`);
    }

    // MAIL FROM
    const mailFromRes = await sendCmd(`MAIL FROM:<${cleanEmail}>`);
    if (!mailFromRes.startsWith('250')) {
      throw new Error(`MAIL FROM failed: ${mailFromRes}`);
    }

    // RCPT TO
    const rcptToRes = await sendCmd(`RCPT TO:<${toEmail.trim()}>`);
    if (!rcptToRes.startsWith('250')) {
      throw new Error(`RCPT TO failed: ${rcptToRes}`);
    }

    // DATA
    const dataRes = await sendCmd('DATA');
    if (!dataRes.startsWith('354')) {
      throw new Error(`DATA failed: ${dataRes}`);
    }

    // Construct Email Content
    const emailBody = [
      `From: "Hangloop Live Music" <${cleanEmail}>`,
      `To: <${toEmail.trim()}>`,
      `Subject: Hangloop Email Verification Code: ${otpCode}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=UTF-8`,
      ``,
      `<!DOCTYPE html>`,
      `<html>`,
      `<body style="font-family: Arial, sans-serif; background-color: #0A0A0E; color: #FFFFFF; padding: 24px;">`,
      `  <div style="max-width: 500px; margin: 0 auto; background: #161622; border-radius: 16px; padding: 32px; border: 1px solid #28283D;">`,
      `    <h2 style="color: #6366F1; margin-top: 0; font-size: 24px;">🎵 Hangloop Live Music</h2>`,
      `    <p style="font-size: 16px; color: #E0E0E6;">Verify your email address to complete your registration on Hangloop.</p>`,
      `    <div style="background: #202030; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">`,
      `      <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #6366F1;">${otpCode}</span>`,
      `    </div>`,
      `    <p style="font-size: 13px; color: #9E9EA6;">This verification code expires in <strong>10 minutes</strong>.</p>`,
      `    <p style="font-size: 12px; color: #666673; margin-bottom: 0;">If you did not request this code, you can safely ignore this email.</p>`,
      `  </div>`,
      `</body>`,
      `</html>`,
      `.`
    ].join('\r\n');

    const sendDataRes = await sendCmd(emailBody);
    if (!sendDataRes.startsWith('250')) {
      throw new Error(`Failed to send email body: ${sendDataRes}`);
    }

    await sendCmd('QUIT');
    return { success: true };
  } catch (err: any) {
    console.error('Gmail SMTPS Error:', err);
    return { success: false, error: err.message || 'Failed to send OTP via Gmail SMTPS' };
  } finally {
    if (socket) {
      try { socket.close(); } catch (_) {}
    }
  }
}
