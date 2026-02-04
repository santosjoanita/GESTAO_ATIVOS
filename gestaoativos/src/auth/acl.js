
export const Profiles = {
  ADMIN: 1,
  GESTOR: 2,
  OPERADOR: 3, 
  CONVIDADO: 4, 
};

export const Permissions = {
  VIEW_DASHBOARD: "view:dashboard",
  VIEW_STOCK: "view:stock",
  VIEW_EXPLORAR: "view:explorar",
  CREATE_EVENTO: "create:evento",
  CREATE_REQUISICAO: "create:requisicao",
  MANAGE_SISTEMA: "manage:sistema",
};

export const permissionsByProfile = {
  [Profiles.ADMIN]: new Set(Object.values(Permissions)),

  [Profiles.GESTOR]: new Set([
    Permissions.VIEW_DASHBOARD,
    Permissions.VIEW_STOCK,
    Permissions.VIEW_EXPLORAR,
    Permissions.CREATE_EVENTO,
    Permissions.CREATE_REQUISICAO,
    Permissions.MANAGE_SISTEMA,
  ]),

  [Profiles.OPERADOR]: new Set([
    Permissions.VIEW_EXPLORAR,     
    Permissions.CREATE_EVENTO,     
    Permissions.CREATE_REQUISICAO, 
  ]),

  [Profiles.CONVIDADO]: new Set([
    Permissions.VIEW_EXPLORAR, 
  ]),
};

export function hasPermission(user, permission) {
  const perfil = user?.id_perfil;
  if (!perfil) return false;
  
  const perms = permissionsByProfile[perfil];
  return !!perms?.has(permission);
}