{
    "jpsType": "install",
    "jpsVersion": "1.7.4",
    "name": "Infra/DecidimEnv",
    "id": "decidim-vanilla-infra-environment",
    "description": {
        "short": "Create a dummy Decidim environment"
    },
    "categories": [
        "apps/platforms"
    ],
    "baseUrl": "{{ appHost }}/octree-gva/voca-jps/main",
    "logo": "assets/decidim_logo.png",
    "ssl": true,
    "ha": false,
    "globals": {
        "DB_PASSWORD": "{{ vault.gen("psql.password", 60) }}",
        "DB_USERNAME": "{{ vault.gen("psql.username", 12) }}",
        "APP_SESSION_KEY": "{{ vault.gen("rails.app_session_key", 128) }}",
        "SECRET_KEY_BASE":  "{{ vault.gen("rails.secret_key_base", 128) }}",
        "MASTER_KEY": "{{ vault.gen("rails.master_key", 128) }}"
    },
    "nodes": [
        {
            "displayName": "public",
            "fixedCloudlets": 4,
            "flexibleCloudlets": 16,
            "diskLimit": "100G",
            "count": 1,
            "env": {
                "APP_SESSION_KEY": "${globals.APP_SESSION_KEY}",
                "DATABASE_HOST": "psql",
                "DATABASE_URL": "postgres://${globals.DB_USERNAME}:${globals.DB_PASSWORD}@psql:5432/decidim",
                "SECRET_KEY_BASE": "${globals.SECRET_KEY_BASE}",
                "MASTER_KEY": "${globals.MASTER_KEY}",
                "RAILS_FORCE_SSL": "enabled",
                "RAILS_CACHE_MODE": "memcached",
                "MEMCACHED_SERVERS": "",
                "RAILS_JOB_MODE": "sidekiq",
                "JOB_REDIS_URL": "redis://default:${globals.REDIS_PASSWORD}@redis:6379/1",
                "DECIDIM_RUN_PUMA": "1",
                "DECIDIM_RUN_SIDEKIQ": "1",
                "DECIDIM_RUN_GRPC": "1",
                "DECIDIM_RUN_CRON": "1"
            },
            "links": [
                "sqldb:psql",
                "cache:cache",
                "nosqldb:redis"
            ],
            "image": "",
            "registry": {
                "url": "https://<DOCKER_HUB IMAGE>",
                "user": "{{ dockerhub.user }}",
                "password": "{{ dockerhub.password }}"
            },
            "nodeGroup": "cp",
            "isSLBAccessEnabled": false,
            "volumes": [
                "/home/decidim/app/public"
            ],
            "volumeMounts": {
                "/home/decidim/app/public": {
                    "protocol": "NFS4",
                    "readOnly": false,
                    "sourceNodeGroup": "storage",
                    "sourcePath": "/data/v026/rails/public"
                },
                "/home/decidim/app/db/migrate": {
                    "protocol": "NFS4",
                    "readOnly": false,
                    "sourceNodeGroup": "storage",
                    "sourcePath": "/data/v026/rails/migrate"
                }
            }
        },
        {
            "displayName": "postgres",
            "fixedCloudlets": 3,
            "flexibleCloudlets": 12,
            "diskLimit": "100G",
            "nodeGroup": "sqldb",
            "image": "postgres:14",
            "isSLBAccessEnabled": false,
            "env": {
                "POSTGRES_PASSWORD": "${globals.DB_PASSWORD}",
                "POSTGRES_DB": "decidim",
                "POSTGRES_USER": "${globals.DB_USER}",
                "ADMINPANEL_ENABLED": false,
                "LC_ALL": "en_US.UTF-8"
            },
            "volumes": [
                "/var/lib/postgresql/data"
            ]
        },
        {
            "displayName": "redis",
            "image": "jelastic/redis:6.2.6",
            "fixedCloudlets": 2,
            "flexibleCloudlets": 16,
            "nodeGroup": "nosqldb",
            "isSLBAccessEnabled": false,
            "env": {
                "ADMINPANEL_ENABLED": false
            }
        },
        {
            "displayName": "files",
            "cloudlets": 2,
            "diskLimit": "100G",
            "nodeGroup": "storage",
            "nodeType": "storage",
            "tag": "2.0-9.4",
            "isSLBAccessEnabled": false,
            "env": {
                "HOME_DIR": "/data"
            },
            "volumes": [
                "/data",
                "/migrations"
            ]
        }
    ],
    "onInstall": [
        "redisSetPassword",
        "nginxSetup",
        "createMigrations"
    ],
    "actions": {
        "redisSetPassword": [
            {
                "cmd[nosqldb]": "jem passwd set -p ${globals.REDIS_PASSWORD}"
            },
            {
                "cmd[nosqldb]": "echo \"time=\\\"$(date +%FT%TZ)\\\" level=info msg=\\\"Redis password changed\\\"\" >> /var/log/run.log"
            }
        ],
        "nginxSetup": [
            {
                "install": null,
                "jps": "scripts/deploy/nginx-conf.yml?_r=${fn.random}",
                "envName": "${env.envName}",
                "loggerName": "Decidim-Nginx"
            },
            "restartNode [bl]"
        ],
        "createMigrations": [
            {
                "cmd[vocacity]": "cd $HOME && bundle exec rails --tasks | grep -E 'rails [^ ]*:install:migrations' | awk -F ' ' '{ print \"bundle exec rails \" $2 \";\" }' | bash"
            }
        ]
    },
    "success": "Someone created a decidim. This email contains private informations, and should\nbe deleted as soon as you review the instance [${settings.PUBLIC_DOMAIN}](${settings.PUBLIC_DOMAIN}).\n\n# Seed and compilation?\nThe seed and compilation are done over GRPC, and not on infrastructure setups.\nThe only permanent setting is the timezone: `${settings.TIMEZONE}`.\n\n# Routing file?\nThe routing file is not defined yet, as the environment is not bound to an instance.\n\n# What are the secrets used in the installation?\n\n* Postgres:\n  * password: `${globals.DB_PASSWORD}`\n  * username: `${globals.DB_USER}`\n* Redis:\n  * password: `${globals.REDIS_PASSWORD}`\n  * username: `${globals.REDIS_USER}`\n* Rails:\n  * APP_SESSION_KEY: `${globals.APP_SESSION_KEY}`\n  * SECRET_KEY_BASE: `${globals.SECRET_KEY_BASE}`\n  * MASTER_KEY: `${globals.MASTER_KEY}`\n\n# Next steps?\nBind an instance.\n"
}