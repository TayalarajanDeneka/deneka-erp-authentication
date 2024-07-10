const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const transporter = nodemailer.createTransport({
  service: "Outlook365",
  host: "smtp.office365.com",
  port: "587",
  tls: {
    ciphers: "SSLv3",
    rejectUnauthorized: false,
  },
  auth: {
    user: process.env.EMAIL_ADDRESS,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendResetEmail = async (email, resetLink) => {
  // Read HTML template
  const templatePath = path.join(__dirname, '../Email_format/forgot_password_template.html');
  const template = fs.readFileSync(templatePath, 'utf8');

  // Replace placeholders with dynamic content
  const htmlContent = template.replace('{{reset_link}}', resetLink);

  const info = await transporter.sendMail({
    from: `Deneka IT <${process.env.EMAIL_ADDRESS}>`,
    to: email,
    subject: "Reset Your Password",
    html: htmlContent
  });

  console.log('Password reset email sent: %s', info.messageId);
};

module.exports = { sendResetEmail };
