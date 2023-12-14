import nodemailer from "nodemailer";
import "dotenv/config";

const { UKR_NET_SENT_FROM, UKR_NET_PASSWORD } = process.env;

const config = {
  host: "smtp.ukr.net",
  port: 465,
  auth: {
    user: UKR_NET_SENT_FROM,
    pass: UKR_NET_PASSWORD,
  },
};

const transport = nodemailer.createTransport(config);

const sendEmail = (data) => {
  const email = { ...data, from: UKR_NET_SENT_FROM };
  return transport.sendMail(email);
};

export default sendEmail;
