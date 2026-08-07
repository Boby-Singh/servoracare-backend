const nodemailer = require("nodemailer");


const transporter = nodemailer.createTransport({

    service: "gmail",

    auth: {
        user: "bobysinghsaini236@gmail.com",
        pass: process.env.GMAIL_APP_PASSWORD
    }

});


const sendOTP = async(email, otp) => {

    await transporter.sendMail({

        from: {
            name: "ServoraCare",
            address: "bobysinghsaini236@gmail.com"
        },

        to: email,

        subject: "ServoraCare OTP Verification",

        html: `
            <h2>ServoraCare</h2>

            <p>Your OTP for password reset is:</p>

            <h1>${otp}</h1>

            <p>This OTP is valid for 5 minutes.</p>

            <br>

            <p>Regards,<br>
            ServoraCare Team</p>
        `
    });

};


module.exports = sendOTP;