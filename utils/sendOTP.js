const nodemailer = require("nodemailer");


const transporter = nodemailer.createTransport({

    host: process.env.SMTP_HOST,

    port: Number(process.env.SMTP_PORT),

    secure: false, // port 587

    auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.GMAIL_APP_PASSWORD
    },

    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000

});


// Check SMTP connection
transporter.verify((error, success) => {

    if (error) {
        console.log("SMTP CONNECTION ERROR:", error.message);
    } else {
        console.log("SMTP SERVER READY");
    }

});


const sendOTP = async(email, otp) => {

    try {

        const info = await transporter.sendMail({

            from: `"ServoraCare" <${process.env.SMTP_EMAIL}>`,

            to: email,

            subject: "ServoraCare Password Reset OTP",

            text: `Your ServoraCare password reset OTP is ${otp}.

This OTP is valid for 5 minutes.`,

            html: `
<h2>ServoraCare Password Reset</h2>

<p>Your OTP is:</p>

<h1>${otp}</h1>

<p>This OTP is valid for 5 minutes.</p>
`

        });


        console.log("EMAIL SENT:", info.messageId);

        return info;


    } catch (error) {

        console.log("EMAIL ERROR:", error);

        throw error;

    }

};


module.exports = sendOTP;