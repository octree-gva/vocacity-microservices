# users related policies. Each user can handle their own passwords
path "secret/data/voca/users/*" {
  capabilities = ["create", "update", "patch", "read", "delete"]
}
path "secret/data/voca/internals" {
  capabilities = ["read"]
}
