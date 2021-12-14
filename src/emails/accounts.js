const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name, secPin) => {
  try {
    sgMail.send({
      to: email,
      from: "testinggrounds221@gmail.com",
      subject: "Lab Attendence Maintenance",
      text: `Hey ${name}. You have registered with Lab attendence Monitoring System with security pin ${secPin}`,
    });
  } catch (e) {
    console.log(e);
  }
};

module.exports = {
  sendWelcomeEmail,
};
