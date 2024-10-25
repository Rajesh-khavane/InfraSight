const nodemailer = require('nodemailer');

// Configure your transporter (use your SMTP credentials)
const transporter = nodemailer.createTransport({
    service: 'gmail', // You can use any email service, e.g., Outlook, Yahoo, etc.
    auth: {
        user: 'fycmirajeshkhavane@gmail.com', // your email
        pass: 'giga dbjs zvwg wlkr'  // your email password or app password if 2FA is enabled
    }
});

const sendAlertEmail = (email, subject, text) => {
    const mailOptions = {
        from: 'fycmirajeshkhavane@gmail.com',
        to: email,
        subject: subject,
        text: text
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
};

module.exports = sendAlertEmail;
