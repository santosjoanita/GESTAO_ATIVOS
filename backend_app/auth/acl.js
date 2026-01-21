
const Profiles = {
  ADMIN: 1,
  GESTOR: 2,
  FUNCIONARIO: 3,
};

const Permissions = {
  VIEW_DASHBOARD: "view:dashboard",
  VIEW_STOCK: "view:stock",
  VIEW_EXPLORAR: "view:explorar",
  CREATE_EVENTO: "create:evento",
  CREATE_REQUISICAO: "create:requisicao",
  MANAGE_SISTEMA: "manage:sistema",
};

const permissionsByProfile = {
  [Profiles.ADMIN]: new Set(Object.values(Permissions)),
  [Profiles.GESTOR]: new Set([
    Permissions.VIEW_DASHBOARD,
    Permissions.VIEW_STOCK,
    Permissions.VIEW_EXPLORAR,
    Permissions.CREATE_EVENTO,
    Permissions.CREATE_REQUISICAO,
    Permissions.MANAGE_SISTEMA,
  ]),
  [Profiles.FUNCIONARIO]: new Set([
    Permissions.VIEW_EXPLORAR,
    Permissions.CREATE_EVENTO,
    Permissions.CREATE_REQUISICAO,
  ]),
};

module.exports = { Profiles, Permissions, permissionsByProfile };