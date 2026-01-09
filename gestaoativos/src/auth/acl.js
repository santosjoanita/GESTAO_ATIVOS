// src/auth/acl.js

export const Profiles = {
  ADMIN: 1,
  GESTOR: 2,
  OPERADOR: 3, // Funcionário comum
};

export const Permissions = {
  VIEW_DASHBOARD: "view:dashboard",     // Painel de controlo (Gestor)
  VIEW_STOCK: "view:stock",             // Gestão de Inventário (Gestor)
  VIEW_EXPLORAR: "view:explorar",       // Ver catálogo (Todos)
  CREATE_EVENTO: "create:evento",       // Criar novo evento (Funcionário/Gestor)
  CREATE_REQUISICAO: "create:requisicao", // Criar nova requisição (Funcionário/Gestor)
  MANAGE_SISTEMA: "manage:sistema",     // Aprovar/Rejeitar e Editar Materiais (Gestor)
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
};

export function hasPermission(user, permission) {
  const perfil = user?.id_perfil;
  if (!perfil) return false;
  
  const perms = permissionsByProfile[perfil];
  return !!perms?.has(permission);
}