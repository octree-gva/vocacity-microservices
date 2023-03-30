import mailer from "moleculer-mail";
const BOOL_VALUES = ["true", "1", "enabled"];
module.exports = {
	name: "mailer",
	mixins: [mailer],
	settings: {
		from: process.env.SMTP_FROM,
		templateFolder: "./email-templates",
		data: {
			appName: process.env.APP_NAME,
			appHost: process.env.APP_HOST,
		},
		htmlToText: true,
		fallbackLanguage: "en",
		transport: {
			service: "sendmail",
			port: parseInt(process.env.SMTP_PORT || "", 10),
			host: process.env.SMTP_ADDRESS,
			secure: BOOL_VALUES.includes(process.env.SMTP_SECURE || "false"),
			auth: {
				user: process.env.SMTP_USERNAME,
				pass: process.env.SMTP_PASSWORD,
			},
		},
	},
};
