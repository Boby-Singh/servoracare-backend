const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);


async function sendOTP(email, otp) {

    try {

        const data = await resend.emails.send({

            from: process.env.EMAIL_FROM,

            to: email,

            subject: "ServoraCare Password Reset OTP",

            html: `
                <h2>ServoraCare</h2>

                <p>Your OTP for password reset is:</p>

                <h1>${otp}</h1>

                <p>This OTP expires in 5 minutes.</p>
            `
        });


        console.log("RESEND SUCCESS:", data);

        return true;


    } catch (error) {

        console.log("RESEND EMAIL ERROR:", error);

        return false;
    }

}


module.exports = sendOTP;