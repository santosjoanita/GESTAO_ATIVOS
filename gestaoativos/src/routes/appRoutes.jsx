import Login from "../Pages/Login.jsx"; 
import Home from "../Pages/Home/Home.jsx"; 
import Perfil from "../Pages/Perfil.jsx";
import SemPermissao from "../Pages/SemPermissao.jsx";
import GestorDashboard from "../Pages/Gestor/GestorDashboard.jsx";
import Stock from "../Pages/Gestor/Stock.jsx";
import Explorar from "../Pages/Material/Explorar.jsx";
import EventoForm from "../forms/EventoForm.jsx"; 
import Requisicao from "../forms/requisicao/Requisicao.jsx"; 
import Produto from "../Pages/Produto/Produto.jsx";
import Carrinho from "../Pages/Carrinho/Carrinho.jsx";
import AdminDashboard from "../Pages/Admin/AdminDashboard.jsx";

import { Permissions } from "../auth/acl.js";

export const appRoutes = [
  { path: "/", element: <Login />, auth: false },
  
  { 
    path: "/admin", 
    element: <AdminDashboard />, 
    auth: true, 
    permission: Permissions.MANAGE_USERS 
  },
  { 
    path: "/home", 
    element: <Home />, 
    auth: true, 
    permission: Permissions.CREATE_REQUISICAO 
  },
  
  { 
    path: "/perfil", 
    element: <Perfil />, 
    auth: true, 
    permission: Permissions.VIEW_EXPLORAR 
  },
  
  { path: "/sem-permissao", element: <SemPermissao />, auth: true },
  
  { 
    path: "/explorar", 
    element: <Explorar />, 
    auth: true, 
    permission: Permissions.VIEW_EXPLORAR 
  },
  
  { 
    path: "/novo-evento", 
    element: <EventoForm />, 
    auth: true, 
    permission: Permissions.CREATE_EVENTO 
  },
  
  { 
    path: "/nova-requisicao", 
    element: <Requisicao />, 
    auth: true, 
    permission: Permissions.CREATE_REQUISICAO 
  },
  
  { 
    path: "/gestao", 
    element: <GestorDashboard />, 
    auth: true, 
    permission: Permissions.VIEW_DASHBOARD 
  },
  
  { 
    path: "/stock", 
    element: <Stock />, 
    auth: true, 
    permission: Permissions.VIEW_STOCK 
  },
  
  {
    path: "/produto/:id",
    element: <Produto />,
    auth: true,
    permission: Permissions.CREATE_REQUISICAO
  },
  
  {
    path: "/carrinho",
    element: <Carrinho />,
    auth: true,
    permission: Permissions.CREATE_REQUISICAO
  }
];