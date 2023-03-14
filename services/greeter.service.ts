import { Context } from "moleculer";

type HelloActionParams = {}
type WelcomeActionParams = {name: string}
module.exports = {
    name: "greeter", 

    actions: {
        hello: {
            graphql: {
                query: "hello: String"
            },
            handler(ctx: Context<HelloActionParams>) {
                return "Hello Moleculer!"
            }
        },
        welcome: {
            params: {
                name: "string"
            },
            graphql: {
                mutation: "welcome(name: String!): String"
            },
            handler(ctx: Context<WelcomeActionParams>) {
                return `Hello ${ctx.params.name}`;
            }
        }
    }
};
