const nodemailer = require('nodemailer');
const { BsWindowSidebar } = require('react-icons/bs');
const speakeasy = require('speakeasy')

exports.SEND_TOTP = async (req, res) => {
    if (req.method == 'Post') {
        const secret = speakeasy.generateSecret({length: 20});
        const token = speakeasy.totp({
            secret: secret.base32,
            encoding: 'base32',
            step: process.env.TIME_TO_EXPIRE // set the token validity to 120 seconds
        });

        let transporter = nodemailer.createTransport({
            host: process.env.EMAIL_PROVIDER,
            port: 587, // or use environment as well
            secure: false, // True for 465, false for other ports
            auth: {
                user: process.env.EMAIL_ADDRESS,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        let info = await transporter.sendMail({
            from: `Deneka IT <${process.env.EMAIL_ADDRESS}>`,
            to: req.body.email,
            subject: "Your Deneka App Email Verfication Code",
            text: `Your verfication code is: ${token}. It is valid for ${process.env.TIME_TO_EXPIRE}.`,
            html: `<b>Your verification code is: ${token}. It is valid for ${process.env.TIME_TO_EXPIRE}.` // HTML body
        });

        console.log("Message sent: %s", info.messageId);

        res.status(200).json({ secret: secret.base32 }); // need to store the secret somewhere else
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
};

exports.VERIFY_TOTP =  async (req, res) => {
    if (req.method === 'POST'){
        const {token, secret} = req.body;

        const verified = speakeasy.verify({
            secret: secret,
            encoding: 'base32',
            taken: token,
            window: 1
        });

        if (verified) {
            res.status(200).send('Email verified successfully!');
        } else{
            res.status(400).send('Invalid verification code.');
        }
    } else{
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
};

// store encrpted secret into the database
function encryptSecret(secret) {
    const crypto = require('crypto');
    const algorithm = 'aes-256-ctr'; // Consider using aes-256-gcm for added authenticity
    const key = process.env.SECRET_KEY; // Key should be 32 bytes
    const iv = crypto.randomBytes(16); // IV is unique for each encryption

    let cipher = crypto.createCipheriv(algorithm, Buffer.from(key, 'hex'), iv);
    let encrypted = cipher.update(secret, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
}