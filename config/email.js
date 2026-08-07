const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendOTP = async(email, otp) => {

    const { data, error } = await resend.emails.send({

        from: "ServoraCare <onboarding@resend.dev>",

        to: [email],

        subject: "ServoraCare Password Reset OTP",

        text: `Your ServoraCare password reset OTP is ${otp}. It is valid for 10 minutes.`

    });


    if (error) {

        console.log("RESEND ERROR:", error);

        throw new Error(error.message);

    }


    console.log("RESEND SUCCESS:", data);

    return data;

};


module.exports = sendOTP;