# PadariaBellaAgatha

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.1.4.

# Padaria Bella Agatha

Aplicação Angular com vitrine pública e painel administrativo para o catálogo da padaria. O cliente usa o Supabase Auth, PostgreSQL e Storage diretamente, com RLS protegendo o acesso administrativo.

## Requisitos

- Node.js suportado pelo Angular CLI 22.
- Projeto Supabase com PostgreSQL e Auth habilitados.

## Configuração local

1. No projeto Supabase existente `catalogos-clientes`, após a migration 006 execute `007_tenant_isolation.sql` e depois `008_remove_duplicate_catalog_tables.sql`.
2. Em Authentication > Users, crie manualmente o usuário administrador e confirme o e-mail.
3. Para um novo tenant, crie a empresa e associe o usuário Auth pelo `auth_user_id` usando o SQL Editor:

```sql
WITH empresa AS (
  INSERT INTO public.empresas (nome, slug)
  VALUES ('Minha Empresa', 'minha-empresa')
  RETURNING id
)
INSERT INTO public.usuarios (auth_user_id, empresa_id, nome, email, role)
SELECT auth_user.id, empresa.id, 'Nome do Administrador', auth_user.email, 'admin'
FROM auth.users AS auth_user
CROSS JOIN empresa
WHERE auth_user.email = 'admin@minhaempresa.com';
```

4. Compile e execute:

```powershell
npm install
npm run build
npm run serve:production
```

Abra `http://localhost:4000/`. O painel fica em `/admin/login`. Para desenvolvimento, execute `npm start` e abra `http://localhost:4200/`.

Inclua o hostname público da implantação em `security.allowedHosts` no `angular.json`; `localhost` já está permitido para desenvolvimento. A lista continua restrita para proteger o SSR contra cabeçalhos `Host` arbitrários.

## Banco e autorização

A migration `database/migrations/001_catalog.sql` cria `categories`, `products` e `product_sizes`, com chaves estrangeiras, restrições, índices, datas e políticas RLS. Categorias não podem ser apagadas enquanto houver produtos associados; tamanhos são apagados junto com o produto. Visitantes consultam apenas categorias visíveis e produtos publicados. A disponibilidade é separada da publicação para sinalizar itens temporariamente indisponíveis.

A migration `database/migrations/002_category_sizes.sql` adiciona a opção `has_sizes` às categorias. No painel, uma categoria contém somente nome e a opção de permitir tamanhos; slug, ícone e ordem são definidos automaticamente.

A migration `database/migrations/003_admin_users.sql` cria a autorização legada ligada ao UUID de `auth.users`. A migration `004_supabase_auth_policies.sql` aplica RLS ao catálogo e cria o bucket `product-images`. A migration `006_usuarios_auth_permissions.sql` concede leitura do perfil autenticado. A migration `007_tenant_isolation.sql` cria tabelas de catálogo ausentes, associa categorias e produtos à empresa, limpa registros órfãos e instala RLS compatível com `usuarios.auth_user_id`. A migration `008_remove_duplicate_catalog_tables.sql` remove as tabelas vazias legadas `productos` e `categorias`; ela usa `RESTRICT`, sem apagar dependências em cascata. A URL pública e a chave publishable ficam em `src/app/core/config/supabase.config.ts`; a chave `service_role` não é usada no frontend.

Para cadastrar novos tenants, o registro da empresa e seus usuários deve ser feito por um operador confiável no SQL Editor ou por um processo server-side com credenciais administrativas. Não exponha a chave `service_role` no navegador.

O RLS restringe administradores à própria empresa. Como o frontend permanece no fluxo legado, o catálogo anônimo continua publicado apenas para a Bella Agatha; expor o catálogo de outros tenants por slug/domínio exige uma etapa posterior de roteamento público.

## Uso do painel

- `/admin/login`: autenticação do administrador configurado no servidor.
- Produtos: cadastro, edição, exclusão com confirmação, categoria, preço base, tamanhos, upload de imagem, ordenação, destaque, publicação e disponibilidade.
- Categorias: cadastro e edição de nome e permissão para tamanhos diferentes; metadados técnicos são automáticos e a exclusão respeita produtos associados.
- `/produtos`: busca por nome/descrição e filtros por categoria. Produtos publicados mas indisponíveis continuam visíveis e não podem ser adicionados ao carrinho.

Os uploads aceitam JPG, PNG, WebP e AVIF até 5 MB e são armazenados no bucket público `product-images` do Supabase Storage.

## Verificações

```powershell
npm run build
npm test -- --watch=false
```

Para desenvolvimento Angular, execute `npm start` e acesse `http://localhost:4200/`.

