const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);


async function sendOTP(email, otp) {

    await resend.emails.send({

        from: "ServoraCare <onboarding@resend.dev>",

        to: email,

        subject: "ServoraCare Password Reset OTP",

        text: `Your OTP is ${otp}. It is valid for 10 minutes.`

    });

}


module.exports = sendOTP;