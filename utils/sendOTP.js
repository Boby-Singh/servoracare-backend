const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendOTP = async(email, otp) => {
    try {
        const { data, error } = await resend.emails.send({
            from: `ServoraCare <${process.env.EMAIL_FROM}>`,
            to: [email],
            subject: "ServoraCare Password Reset OTP",

            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto;">
                    <h2>ServoraCare</h2>

                    <p>Your OTP for password reset is:</p>

                    <h1 style="letter-spacing: 8px; text-align: center;">
                        ${otp}
                    </h1>

                    <p>This OTP is valid for <strong>5 minutes</strong>.</p>

                    <p>If you did not request this OTP, please ignore this email.</p>

                    <hr>

                    <p style="font-size: 12px; color: gray;">
                        © ServoraCare
                    </p>
                </div>
            `
        });

        if (error) {
            console.error("RESEND ERROR:", error);
            throw error;
        }

        console.log("RESEND SUCCESS:", data);

        return data;

    } catch (error) {
        console.error("EMAIL ERROR:", error);
        throw error;
    }
};

module.exports = sendOTP;