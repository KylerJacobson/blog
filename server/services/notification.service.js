require("dotenv").config();
const { ROLE } = require("../constants/roleConstants");
const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const environment = process.env.ENVIRONMENT;

class NotificationService {
    async notify(user, post) {
        if (
            post.restricted &&
            (user.role === ROLE.NON_PRIVILEGED || user.role === ROLE.REQUESTED)
        ) {
            return;
        }
        const msg = {
            to: user.email,
            from: "kyler@kylerjacobson.dev",
            subject: post.title,
            text: "There is a new post on kylerjacobson.dev",
            html: `Hey ${user.first_name}, there is a new post on kylerjacobson.dev. Check out <a href="www.kylerjacobson.dev/signin">${post.title}</a>`,
        };
        if (environment !== "dev") {
            sgMail.send(msg).catch((error) => {
                console.error(error);
            });
        }
        return;
    }
}

module.exports = NotificationService;
