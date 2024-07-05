const nodemailer = require('nodemailer');
const speakeasy = require('speakeasy');
const { connection } = require('../config/db');
const fs = require('fs');

const SEND_TOTP = async (email, secret) => {
    secret = speakeasy.generateSecret({ length: 20 });
    console.log(email);
    const token = speakeasy.totp({
        secret: secret.base32,
        encoding: 'base32',
        step: 30, // Assuming standard TOTP validity step
        window: 2
    });

    let transporter = nodemailer.createTransport({
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

    try {
        // First, delete any existing TOTP records for the email
        await new Promise((resolve, reject) => {
            const deleteQuery = `DELETE FROM TOTP WHERE Email = ?;`;
            connection.execute({
                sqlText: deleteQuery,
                binds: [email],
                complete: (err, stmt, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            });
        });
        // console.log("Previous TOTP records deleted successfully");

        // Then, insert the new TOTP record
        const insertQuery = `INSERT INTO TOTP (Email, TOTP_Code, TOTP_SECRET) VALUES (?, ?, ?);`;
        const result = await new Promise((resolve, reject) => {
            connection.execute({
                sqlText: insertQuery,
                binds: [email, token, secret.base32],
                complete: (err, stmt, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            });
        });
        // console.log("INSERT query executed successfully", result);
    } catch (err) {
        console.error('Failed to execute database statement due to the following error:', err.message);
        return false;
    }

    // console.log("Start sending email");
    try {
        sendVerificationEmail(transporter, email, token)
        // let info = await transporter.sendMail({
        //     from: `Deneka IT <${process.env.EMAIL_ADDRESS}>`,
        //     to: email,
        //     subject: "Your Deneka App Email Verification Code",
        //     text: `Your verification code is: ${token}. It is valid for ${process.env.TIME_TO_EXPIRE} seconds.`,
        //     html: `<b>Your verification code is: ${token}. It is valid for ${process.env.TIME_TO_EXPIRE} seconds.</b>` // HTML body
        // });
        // console.log("Message sent: %s", info.messageId);
    } catch (error) {
        console.error("Failed to send email:", error);
        return false;
    }

    return true;
};

const sendVerificationEmail = async (transporter, email, token) => {
    // Read HTML template
    const template = fs.readFileSync('Email_format/email_template.html', 'utf8');

    // Replace placeholders with dynamic content
    const htmlContent = template.replace('{{verification_code}}', token);

    const info = await transporter.sendMail({
        from: `Deneka IT <${process.env.EMAIL_ADDRESS}>`,
        to: email,
        subject: "Your Deneka App Email Verification Code",
        text: `Your verification code is: ${token}. It is valid for ${process.env.TIME_TO_EXPIRE} seconds.`,
        html: htmlContent // HTML body
    });

    console.log('Message sent: %s', info.messageId);
};

const login_SEND_TOTP = async (email, secret) => {

    let transporter = nodemailer.createTransport({
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


    const token = speakeasy.totp({
        secret: secret,
        encoding: 'base32',
        step: 30, // Assuming standard TOTP validity step
        window: 2
    });

    console.log(`Token submitted: ${token}`);
    console.log(`Secret retrieved: ${secret}`);

    try {
        sendVerificationEmail(transporter, email, token)
        // let info = await transporter.sendMail({
        //     from: `Deneka IT <${process.env.EMAIL_ADDRESS}>`,
        //     to: email,
        //     subject: "Your Deneka App Email Verification Code",
        //     text: `Your verification code is: ${token}. It is valid for ${process.env.TIME_TO_EXPIRE} seconds.`,
        //     html: `<b>Your verification code is: ${token}. It is valid for ${process.env.TIME_TO_EXPIRE} seconds.</b>` // HTML body
        // });
        // console.log("Message sent: %s", info.messageId);
    } catch (error) {
        console.error("Failed to send email:", error);
        return false;
    }

    return true;
};

const VERIFY_TOTP = (token, secret_base32) => {
    const verified = speakeasy.totp.verify({
        secret: secret_base32,
        encoding: 'base32',
        token: token,
        window: 2
    });

    return verified;
};

// Export both functions
module.exports = { SEND_TOTP, VERIFY_TOTP, login_SEND_TOTP };
