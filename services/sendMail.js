const nodemailer = require(`nodemailer`);

module.exports.EmailService = {
  sendEmail: async (to, subject, template) => {
    try {
      const transporter = nodemailer.createTransport({
        service: `gmail`,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: `'Wholesome By WH' <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html: template,
      };

      const info = await transporter.sendMail(mailOptions);
      return info;
    } catch (error) {
      throw new Error(error);
    }
  },
};
