// const { Resend } = require("resend");

// const resend = new Resend(process.env.RESEND_API_KEY);

// const sendOTP = async(email, otp) => {
//     try {
//         const { data, error } = await resend.emails.send({
//             from: `ServoraCare <${process.env.EMAIL_FROM}>`,
//             to: [email],
//             subject: "ServoraCare Password Reset OTP",

//             html: `
//                 <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto;">
//                     <h2>ServoraCare</h2>

//                     <p>Your OTP for password reset is:</p>

//                     <h1 style="letter-spacing: 8px; text-align: center;">
//                         ${otp}
//                     </h1>

//                     <p>This OTP is valid for <strong>5 minutes</strong>.</p>

//                     <p>If you did not request this OTP, please ignore this email.</p>

//                     <hr>

//                     <p style="font-size: 12px; color: gray;">
//                         © ServoraCare
//                     </p>
//                 </div>
//             `
//         });

//         if (error) {
//             console.error("RESEND ERROR:", error);
//             throw error;
//         }

//         console.log("RESEND SUCCESS:", data);

//         return data;

//     } catch (error) {
//         console.error("EMAIL ERROR:", error);
//         throw error;
//     }
// };

// module.exports = sendOTP;


const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendOTP = async(email, otp) => {
    try {
        const { data, error } = await resend.emails.send({
            from: `ServoraCare <${process.env.EMAIL_FROM}>`,
            to: [email],
            subject: "Your ServoraCare Password Reset OTP",

            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ServoraCare OTP</title>
</head>

<body style="
    margin: 0;
    padding: 0;
    background-color: #f4f7fb;
    font-family: Arial, Helvetica, sans-serif;
">

    <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 15px;">
        <tr>
            <td align="center">

                <!-- Main Card -->
                <table
                    width="100%"
                    cellpadding="0"
                    cellspacing="0"
                    style="
                        max-width: 520px;
                        background-color: #ffffff;
                        border-radius: 12px;
                        overflow: hidden;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.08);
                    "
                >

                    <!-- Header -->
                    <tr>
                        <td style="
                            background-color: #0b4ea2;
                            padding: 28px 30px;
                            text-align: center;
                        ">
                            <h1 style="
                                margin: 0;
                                color: #ffffff;
                                font-size: 28px;
                                letter-spacing: 1px;
                            ">
                                SERVORACARE
                            </h1>

                            <p style="
                                margin: 8px 0 0;
                                color: #dbeafe;
                                font-size: 13px;
                            ">
                                Services That Care
                            </p>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 35px 35px 25px;">

                            <h2 style="
                                margin: 0 0 15px;
                                color: #1f2937;
                                font-size: 22px;
                            ">
                                Password Reset Request
                            </h2>

                            <p style="
                                color: #4b5563;
                                font-size: 15px;
                                line-height: 1.6;
                            ">
                                Hello,
                            </p>

                            <p style="
                                color: #4b5563;
                                font-size: 15px;
                                line-height: 1.6;
                            ">
                                We received a request to reset the password
                                for your ServoraCare account.
                            </p>

                            <p style="
                                color: #4b5563;
                                font-size: 15px;
                                line-height: 1.6;
                            ">
                                Please use the verification code below:
                            </p>

                            <!-- OTP Box -->
                            <div style="
                                margin: 30px 0;
                                padding: 22px;
                                background-color: #f0f6ff;
                                border: 1px solid #c7ddff;
                                border-radius: 10px;
                                text-align: center;
                            ">

                                <p style="
                                    margin: 0 0 10px;
                                    color: #6b7280;
                                    font-size: 13px;
                                    text-transform: uppercase;
                                    letter-spacing: 1px;
                                ">
                                    Your Verification Code
                                </p>

                                <div style="
                                    font-size: 32px;
                                    font-weight: bold;
                                    letter-spacing: 8px;
                                    color: #0b4ea2;
                                ">
                                    ${otp}
                                </div>

                            </div>

                            <p style="
                                color: #374151;
                                font-size: 14px;
                                line-height: 1.6;
                            ">
                                This OTP will expire in
                                <strong>5 minutes</strong>.
                            </p>

                            <p style="
                                color: #6b7280;
                                font-size: 13px;
                                line-height: 1.6;
                            ">
                                For your security, never share this verification
                                code with anyone. ServoraCare will never ask you
                                to share your OTP.
                            </p>

                            <hr style="
                                border: none;
                                border-top: 1px solid #e5e7eb;
                                margin: 30px 0;
                            ">

                            <p style="
                                margin: 0;
                                color: #6b7280;
                                font-size: 13px;
                                line-height: 1.6;
                            ">
                                If you did not request a password reset,
                                you can safely ignore this email. Your account
                                will remain secure.
                            </p>

                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="
                            background-color: #f8fafc;
                            padding: 22px 30px;
                            text-align: center;
                            border-top: 1px solid #e5e7eb;
                        ">

                            <p style="
                                margin: 0 0 8px;
                                color: #0b4ea2;
                                font-size: 14px;
                                font-weight: bold;
                            ">
                                ServoraCare
                            </p>

                            <p style="
                                margin: 0 0 8px;
                                color: #6b7280;
                                font-size: 12px;
                            ">
                                Services That Care
                            </p>

                            <p style="
                                margin: 0;
                                color: #9ca3af;
                                font-size: 11px;
                            ">
                                © ${new Date().getFullYear()} ServoraCare.
                                All rights reserved.
                            </p>

                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>

</body>
</html>
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