import nodemailer from 'nodemailer';

const isMailConfigured = (): boolean => {
  return !!(
    process.env.EMAIL_HOST &&
    process.env.EMAIL_PORT &&
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASS
  );
};

let transporter: nodemailer.Transporter | null = null;

if (isMailConfigured()) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  console.log('✅ Nodemailer SMTP transporter initialized.');
} else {
  console.warn('⚠️ SMTP credentials missing. Emails will be logged to the server console.');
}

export { transporter, isMailConfigured };
