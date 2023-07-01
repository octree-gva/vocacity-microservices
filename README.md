<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [micro-voca](#micro-voca)
  - [Repl Client](#repl-client)
  - [Services](#services)
  - [Guidelines](#guidelines)
    - [`[TS]` Use `ServiceDefinition` type](#ts-use-servicedefinition-type)
  - [Useful links](#useful-links)
  - [YARN scripts](#yarn-scripts)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

[![Moleculer](https://badgen.net/badge/Powered%20by/Moleculer/0e83cd)](https://moleculer.services)

# micro-voca

This is a [Moleculer](https://moleculer.services/)-based microservices project. Generated with the [Moleculer CLI](https://moleculer.services/docs/0.14/moleculer-cli.html).

## Repl Client

Start the project with `npm run dev` command.
After starting, open the http://localhost:3000/ URL in your browser.
On the welcome page you can test the generated services via API Gateway and check the nodes & services.

In the terminal, try the following commands:

-   `nodes` - List all connected nodes.
-   `actions` - List all registered service actions.
-   `call dns.newToken` - Call the `dns.newToken` action.
-   `call dns.routing --token <token given by newToken>` - Call the `dns.routing` action with the `token` parameter.

## Services

-   **api**: API Gateway services
-   **deployments**: Deployment service, to orchestrate deployment of apps (decidim and ...)
-   **dns**: Provide a http router endpoint to traefik, to observe the infrastructure
-   **env-inspect**: Give full or summarized details about the infrastructure
-   **env-labels**: Get/Set labels for one environment (Similar to Docker labels)
-   **frontend**: Serve the nextjs frontend app
-   **jobs**: Observability for ongoing job throughough the application
-   **user-permissions-data**: DB service to store who can do what on what resource
-   **user-permissions**: register/login/lostpassword procedures
-   **user-data**: DB service to store details about user accounts
-   **vault**: Get/Set secret data in a bucket. Use Hashicorp Vault

## Events

### `deployment.created`

|  Description  | Destination Services | 
|--------------|----------------------|
| Someone order a new deployment of an application (decidim or so...) | __Broadcast__           |

**Payload**
|  Name  | Description | Type |
|--------------|----------------------|---------|
| `deployment` | `deployment` model. | Deployment |
| `appId` | One of the supported app to deploy (See APP_IDS in types.ts) | String |

## Guidelines
### `[TS]` Use `ServiceDefinition` type

Type each methods params and returns type. This will force the complete use of the `fastest-validators`.

```typescript
// don't
export default {
    name: "api",
    /* etc. */
};
```
```typescript
// do
const ApiService: ServiceDefinition<
    {
        version: { params: {}; returns: { version: string } };
    },
    []
> = {
    name: "api",
    /* etc. */
};
```

## Useful links

-   Moleculer website: https://moleculer.services/
-   Moleculer Documentation: https://moleculer.services/docs/0.14/
-   Moleculer Appolo Graphql Documentation: https://github.com/moleculerjs/moleculer-apollo-server
-   Jelastic Virtuozzo Cloud Scripting (manifests): https://docs.cloudscripting.com
-   Jelastic Virtuozzo API: https://docs.jelastic.com/api/#!/api
-   BullMQ: https://docs.bullmq.io
-   Hashicorp Vault Documentation: https://developer.hashicorp.com/vault/docs

## YARN scripts

-   `yarn prettier:fix`: Prettify your scripts
-   `yarn dev`: Start development mode (load all services locally with hot-reload & REPL)
-   `yarn start`: Start production mode (set `SERVICES` env variable to load certain services)
-   `yarn cli`: Start a CLI and connect to production. Don't forget to set production namespace with `--ns` argument in script
-   `yarn lint`: Run ESLint
-   `yarn ci`: Run continuous test mode with watching
-   `yarn test`: Run tests & generate coverage report
-   `yarn dc:up`: Start the stack with Docker Compose
-   `yarn dc:down`: Stop the stack with Docker Compose
