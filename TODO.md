# 📋 GESTÃO DE ATIVOS - STATUS DO PROJETO

## 🟢 CONCLUÍDO (JÁ IMPLEMENTADO)

### 🎨 Interface & Visual
- [x] **Badge de Cargo:** Adicionado "GESTOR" ou "FUNCIONÁRIO" no Header de todas as páginas.
- [x] **Formatação de Datas:** Globalmente alterado para `DD/MM/AAAA` em tabelas e detalhes.
- [x] **Eventos no Perfil:** Agora mostra o intervalo completo: *"Data Início até Data Fim"*.
- [x] **Google Maps:** Coordenadas no detalhe do evento agora são um link clicável para o mapa.

### ⚙️ Gestão & Funcionalidades
- [x] **Filtros de Estado:** Separação visual (cores) entre "Recusado" e "Cancelado".
- [x] **Dashboard Gestor:** Filtro inicial configurado para abrir logo em "Pendentes".
- [x] **Fluxo Simplificado:** Removido o botão "Marcar Levantamento" (Aprovado -> Em Curso).
- [x] **Edição pelo Gestor:** Botão "Editar Materiais" funcional, com redirecionamento inteligente no carrinho.

### 🐛 Correções de Código (Bugs)
- [x] **Erro de Sintaxe:** Corrigido o erro crítico de comparação (`=<` para `<`) no Produto.
- [x] **Bloqueio de Datas:** Inputs de data bloqueados (readonly) ao adicionar itens ao carrinho.

---

## 🟠 A VERIFICAR (TESTES RÁPIDOS)
- [ ] **Validação EventoForm:** Testar se impede mesmo datas no passado.
- [ ] **UX Carrinho:** Confirmar se o redirecionamento pós-submissão está correto para cada perfil.

---

## 🔴 PRÓXIMOS PASSOS (A BOMBA)
- [ ] **Lógica de Colisão de Stock:** Query de backend para calcular disponibilidade real entre datas intersetadas.
- [ ] **Edição de Quantidades:** Permitir que o gestor altere quantidades diretamente no modal de detalhes.