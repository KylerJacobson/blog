require("dotenv").config();
const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

class NotificationService {
    async notify(user, post) {
        if (post.restricted && (user.role === 0 || user.role === -1)) {
            console.log(
                `${user.first_name} does not have permissions for post`
            );
            return;
        }
        const msg = {
            to: user.email,
            from: "kyler@kylerjacobson.dev",
            subject: post.title,
            text: "There is a new post on kylerjacobson.dev",
            html: `Hey ${user.first_name}, there is a new post on kylerjacobson.dev. Check out <a href="www.kylerjacobson.dev/signin">${post.title}</a>`,
        };
        console.log(msg);
        sgMail.send(msg).catch((error) => {
            console.error(error);
        });
        return;
    }
}

module.exports = NotificationService;
