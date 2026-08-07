const nodemailer = require("nodemailer");


const transporter = nodemailer.createTransport({

    host: process.env.SMTP_HOST,

    port: Number(process.env.SMTP_PORT),

    secure: false, // 587 = false, 465 = true

    auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.GMAIL_APP_PASSWORD
    }

});


const sendOTP = async(email, otp) => {

    try {

        const info = await transporter.sendMail({

            from: `"ServoraCare" <${process.env.SMTP_EMAIL}>`,

            to: email,

            subject: "ServoraCare Password Reset OTP",

            text: `
Your ServoraCare password reset OTP is ${otp}.

This OTP is valid for 5 minutes.
            `,

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

        console.log("EMAIL ERROR:", error.message);

        throw error;

    }

};


module.exports = sendOTP;