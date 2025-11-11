// // const axios = require("axios");
// import axios from "axios"

// const RESEND_API_URL = "https://api.resend.com/emails";

// /**
//  * sendEmail({ to, subject, html, text, fromName, fromEmail })
//  */
// async function sendEmail({ to, subject, html, text, fromName = "Dynamic Website", fromEmail = "no-reply@resend.dev" }) {
//   const apiKey = process.env.RESEND_API_KEY;
//   if (!apiKey) throw new Error("RESEND_API_KEY not set in env");

//   const payload = {
//     from: `${fromName} <${fromEmail}>`,
//     to: [to],
//     subject,
//     html
//   };

//   try {
//     const res = await axios.post(RESEND_API_URL, payload, {
//       headers: {
//         Authorization: `Bearer ${apiKey}`,
//         "Content-Type": "application/json"
//       }
//     });
//     return res.data;
//   } catch (err) {
//     // bubble up error with useful message
//     const msg = err.response?.data || err.message;
//     throw new Error(`Resend error: ${JSON.stringify(msg)}`);
//   }
// }

// module.exports = { sendEmail };

// import axios from "axios";

// export const sendEmail = async ({ to, subject, html }) => {
//   try {
//     const response = await axios.post(
//       "https://api.resend.com/emails",
//       {
//         from: "Tarun <onboarding@resend.dev>",
//         to,
//         subject,
//         html,
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     console.log("Email sent:", response.data);
//     return true;
//   } catch (error) {
//     console.error("Email Error:", error.response?.data || error.message);
//     return false;
//   }
// };


// backend/utils/sendEmail.js
// import { Resend } from "resend";

// const resend = new Resend(process.env.RESEND_API_KEY);

// export async function sendEmail({ to, subject, html }) {
//   try {
//     const response = await resend.emails.send({
//       from: process.env.RESEND_FROM,
//       to,
//       subject,
//       html,
//     });

//     console.log("Email sent:", response);
//     return response;
//   } catch (err) {
//     console.error("Email sending failed:", err);
//     throw err;
//   }
// }

export const sendEmail = async ({ to, subject, html }) => {
  console.log("📩 Email function is disabled for now");
  console.log("To:", to);
  console.log("Subject:", subject);
  return { success: true };
};