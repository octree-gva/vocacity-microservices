const NextJS = require("moleculer-nextjs");

module.exports = {
	name: "www",
	mixins: [NextJS],
	settings: {
		name: "FrontOffice",
		dev: process.env.NODE_ENV !== "production",
		port: 4000,
		dir: "www/.next",
	},
};
