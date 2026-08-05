import { transporter, isMailConfigured } from '../config/mailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  const from = process.env.EMAIL_USER || 'no-reply@winsoft.in';

  if (isMailConfigured() && transporter) {
    try {
      await transporter.sendMail({
        from: `"Winsoft Website" <${from}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
      console.log(`✉️ Email successfully sent to ${options.to}: "${options.subject}"`);
      return true;
    } catch (error) {
      console.error(`❌ Error sending email to ${options.to}:`, error);
      return false;
    }
  } else {
    // Graceful development fallback
    console.log('\n================== ✉️ DEVELOPMENT EMAIL LOG ==================');
    console.log(`FROM: "Winsoft Website" <${from}>`);
    console.log(`TO: ${options.to}`);
    console.log(`SUBJECT: ${options.subject}`);
    console.log('CONTENT (HTML):');
    console.log(options.html);
    console.log('============================================================\n');
    return true;
  }
};
