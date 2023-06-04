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
    "logo": "assets/decidim_logo.png",
    "ssl": true,
    "ha": false,
    "skipNodeEmails": true,
    "globals": {
        "REDIS_PASSWORD": "{{ vault.gen("redis.password", 128) }}",
        "DB_PASSWORD": "{{ vault.gen("psql.password", 60) }}",
        "DB_USERNAME": "{{ vault.gen("psql.username", 12) }}",
        "APP_SESSION_KEY": "{{ vault.gen("rails.app_session_key", 128) }}",
        "SECRET_KEY_BASE":  "{{ vault.gen("rails.secret_key_base", 128) }}",
        "MASTER_KEY": "{{ vault.gen("rails.master_key", 128) }}"
    },
    "nodes": [
        {
            "displayName": "public",
            "fixedCloudlets": 9,
            "flexibleCloudlets": 24,
            "diskLimit": "100G",
            "count": 1,
            "env": {
                "APP_SESSION_KEY": "${globals.APP_SESSION_KEY}",
                "DATABASE_HOST": "psql",
                "DATABASE_PASSWORD": "${globals.DB_PASSWORD}",
                "DATABASE_DATABASE": "decidim",
                "DATABASE_USERNAME": "${globals.DB_USER}",
                "DATABASE_URL": "postgres://${globals.DB_USER}:${globals.DB_PASSWORD}@psql:5432/decidim",
                "SECRET_KEY_BASE": "${globals.SECRET_KEY_BASE}",
                "MASTER_KEY": "${globals.MASTER_KEY}",
                "MEMCACHED_SERVERS": "memcached:11211",
                "RAILS_FORCE_SSL": "disabled",
                "RAILS_CACHE_MODE": "memcached",
                "RAILS_JOB_MODE": "sidekiq",
                "REDIS_URL": "redis://default:${globals.REDIS_PASSWORD}@redis:6379/1",
                "REDIS_CONFIG_URL": "redis://default:${globals.REDIS_PASSWORD}@redis:6379/2",
                "DECIDIM_RUN_PUMA": "1",
                "DECIDIM_RUN_SIDEKIQ": "1",
                "DECIDIM_RUN_GRPC": "1",
                "DECIDIM_RUN_CRON": "1",
                "DECIDIM_RUN_NGINX": "1",
                "SMTP_ADDRESS": "{{ vault.internal("smtp.address" )}}",
                "SMTP_USERNAME": "{{ vault.internal("smtp.username" )}}",
                "SMTP_PASSWORD": "{{ vault.internal("smtp.password" )}}",
                "SMTP_DOMAIN": "{{ vault.internal("smtp.domain" )}}",
                "SMTP_PORT": "{{ vault.internal("smtp.port" )}}",
                "SMTP_SSL": "enabled",
                "SMTP_TLS": "disabled"
            },
            "links": [
                "sqldb:psql",
                "nosqldb:redis",
                "cache:cache"
            ],
            "image": "octree/voca-decidim:0.26-latest",
            "nodeGroup": "cp",
            "isSLBAccessEnabled": false,
            "volumes": [
                "/home/decidim/app/public",
                "/home/decidim/app/db/migrate",
                "/home/decidim/app/config",
                "/home/decidim/app/storage",
                "/home/decidim/app/log"
            ],
            "volumeMounts": {
                "/home/decidim/app/public": {
                    "protocol": "NFS4",
                    "readOnly": false,
                    "sourceNodeGroup": "storage",
                    "sourcePath": "/data/v026/rails/public"
                },
                "/home/decidim/app/log": {
                    "protocol": "NFS4",
                    "readOnly": false,
                    "sourceNodeGroup": "storage",
                    "sourcePath": "/data/v026/rails/log"
                },
                "/home/decidim/app/db/migrate": {
                    "protocol": "NFS4",
                    "readOnly": false,
                    "sourceNodeGroup": "storage",
                    "sourcePath": "/data/v026/rails/migrate"
                },
                "/home/decidim/app/config": {
                    "protocol": "NFS4",
                    "readOnly": false,
                    "sourceNodeGroup": "storage",
                    "sourcePath": "/data/v026/rails/config"
                },
                "/home/decidim/app/storage": {
                    "protocol": "NFS4",
                    "readOnly": false,
                    "sourceNodeGroup": "storage",
                    "sourcePath": "/data/v026/rails/storage"
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
            ],
            "/var/lib/postgresql/data": {
                "/data": {
                    "protocol": "NFS4",
                    "readOnly": false,
                    "sourceNodeGroup": "storage",
                    "sourcePath": "/data/v026/postgres"
                }
            }
        },
        {
            "displayName": "redis",
            "image": "redis:7.0.9-alpine",
            "fixedCloudlets": 1,
            "flexibleCloudlets": 6,
            "nodeGroup": "nosqldb",
            "entrypoint": "redis-server --appendonly yes --requirepass ${globals.REDIS_PASSWORD}",
            "isSLBAccessEnabled": false,
            "env": {
                "ADMINPANEL_ENABLED": false
            },
            "volumes": [
                "/data"
            ],
            "volumesMounts": {
                "/data": {
                    "protocol": "NFS4",
                    "readOnly": false,
                    "sourceNodeGroup": "storage",
                    "sourcePath": "/data/v026/redis"
                }
            }
        },
        {
            "displayName": "memcached",
            "image": "memcached:1.6-alpine",
            "fixedCloudlets": 1,
            "flexibleCloudlets": 6,
            "nodeGroup": "cache",
            "entrypoint": "redis-server --appendonly yes --requirepass ${globals.REDIS_PASSWORD}",
            "isSLBAccessEnabled": false,
            "env": {
                "ADMINPANEL_ENABLED": false
            }
        },
        {
            "displayName": "files",
            "fixedCloudlets": 1,
            "flexibleCloudlets": 5,
            "diskLimit": "100G",
            "nodeGroup": "storage",
            "nodeType": "storage",
            "tag": "2.0-9.4",
            "isSLBAccessEnabled": false,
            "env": {
                "HOME_DIR": "/data"
            },
            "volumes": [
                "/data"
            ]
        }
    ],
    "onInstall": [
        "dependancies",
        "volumes",
        "installation",
        "finalize"
    ],
    "actions": {
        "dependancies": [
            {
                "cmd[cp]": [
                    "apk add --update --no-cache restic nginx musl-dev npm yarn",
                    "adduser decidim nginx",
                    "mkdir -p /var/log/nginx/ /var/nginx/tmp/ /var/lib/nginx/logs /var/lib/nginx/tmp/ /home/decidim/app/tmp/pids",
                    "touch /var/lib/nginx/logs/error.log /var/lib/nginx/logs/access.log",
                    "chown -R decidim:decidim /etc/nginx /var/log/nginx /var/nginx/tmp /var/lib/nginx /home/decidim/app/tmp"
                ]
            },
            {
                "cmd[storage]": [
                    "yum-config-manager --add-repo https://copr.fedorainfracloud.org/coprs/copart/restic/repo/epel-7/copart-restic-epel-7.repo",
                    "yum install -y restic jq"
                ]
            }
        ],
        "volumes": [
            {
                "cmd[cp]": [
                    "cd $ROOT",
                    "tar xvfz tmp/volumes.tar.gz -C /",
                    "chown -R decidim:decidim public db/migrate storage config"
                ]
            }
        ],
        "installation": [
            {
                "cmd[cp]": [
                    "crontab /usr/local/share/crontab.template",
                    "cd $ROOT",
                    "bundle",
                    "bundle exec rails --tasks | grep -E 'rails [^ ]*:install:migrations' | awk -F ' ' '{ print \"bundle exec rails \" $2 \";\" }' | bash",
                    "bundle exec rails --tasks | grep -E 'rails [^ ]*:webpacker:install' | awk -F ' ' '{ print \"bundle exec rails \" $2 \";\" }' | bash",
                    "npm ci",
                    "bundle exec rails db:migrate",
                    "bundle exec rails assets:precompile"
                ]
            }
        ],
        "finalize": [
            {
                "cmd[cp]": [
                    "mkdir -p /home/decidim/app/log",
                    "ln -s /home/decidim/app/log /var/log/decidim",
                    "chown decidim:decidim /home/decidim/app/log",
                    "cd $ROOT",
                    "bundle exec rails restart"
                ]
            }
        ]
    },
    "success": "Voca parked a decidim\n"
}
