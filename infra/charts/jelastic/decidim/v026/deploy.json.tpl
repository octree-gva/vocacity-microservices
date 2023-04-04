{
    "jpsType": "install",
    "jpsVersion": "1.7.4",
    "name": "infra/charts/jelastic/decidim/v026/deploy.json",
    "id": "decidim-v026",
    "description": {
        "short": "Create a Decidim environment"
    },
    "categories": [
        "apps/platforms"
    ],
    "ssl": false,
    "ha": false,
    "globals": {
        "REDIS_PASSWORD": "{{ vault.gen("redis.password", 128) }}",
        "DB_PASSWORD": "{{ vault.gen("psql.password", 60) }}",
        "DB_USERNAME": "{{ vault.gen("psql.username", 12) }}",
        "APP_SESSION_KEY": "{{ vault.gen("rails.app_session_key", 128) }}",
        "SECRET_KEY_BASE":  "{{ vault.gen("rails.secret_key_base", 128) }}",
        "MASTER_KEY": "{{ vault.gen("rails.master_key", 128) }}",
        "DECIDIM_IMAGE": "octree/voca-decidim:0.26-latest"
    },
    "nodes": [
        {
            "displayName": "public",
            "fixedCloudlets": 5,
            "flexibleCloudlets": 48,
            "diskLimit": "100G",
            "count": 1,
            "env": {
                "APP_SESSION_KEY": "${globals.APP_SESSION_KEY}",
                "DATABASE_URL": "postgres://${globals.DB_USERNAME}:${globals.DB_PASSWORD}@psql:5432/decidim",
                "SECRET_KEY_BASE": "${globals.SECRET_KEY_BASE}",
                "MASTER_KEY": "${globals.MASTER_KEY}",
                "RAILS_CACHE_MODE": "memcached",
                "MEMCACHED_SERVERS": "",
                "RAILS_JOB_MODE": "sidekiq",
                "JOB_REDIS_URL": "redis://default:${globals.REDIS_PASSWORD}@redis:6379/1",
                "DECIDIM_RUN_NGINX": "1",
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
            "image": "${globals.DECIDIM_IMAGE}",
            "nodeGroup": "cp",
            "isSLBAccessEnabled": false,
            "volumes": [
                "/home/decidim/app/public",
                "/home/decidim/app/db/migrate",
                "/home/decidim/app/config",
                "/home/decidim/app/storage"
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
                "/var/lib/postgresql/data",
                "/backups"
            ],
            "volumeMounts": {
                "/backups": {
                    "protocol": "NFS4",
                    "readOnly": false,
                    "sourceNodeGroup": "storage",
                    "sourcePath": "/data/v026/postgres"
                }
            }
        },
        {
            "displayName": "memcached",
            "fixedCloudlets": 1,
            "flexibleCloudlets": 6,
            "diskLimit": "100G",
            "nodeGroup": "cache",
            "image": "memcached:1.6-alpine",
            "isSLBAccessEnabled": false,
            "env": {},
            "volumes": []
        },
        {
            "displayName": "redis",
            "image": "redis:7.0.9-alpine",
            "fixedCloudlets": 1,
            "flexibleCloudlets": 6,
            "nodeGroup": "nosqldb",
            "isSLBAccessEnabled": false,
            "entrypoint": "redis-server --appendonly yes --requirepass ${globals.REDIS_PASSWORD}",
            "env": {
                "ADMINPANEL_ENABLED": false
            },
            "volumes": [
                "/data"
            ],
            "volumeMounts": {
                "/data": {
                    "protocol": "NFS4",
                    "readOnly": false,
                    "sourceNodeGroup": "storage",
                    "sourcePath": "/data/v026/redis"
                }
            }
        },
        {
            "displayName": "files",
            "fixedCloudlets": 1,
            "flexibleCloudlets": 6,
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
    "success": "A new decidim is up"
}