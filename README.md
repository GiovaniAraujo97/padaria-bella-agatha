# PadariaBellaAgatha

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.1.4.

# Padaria Bella Agatha

Aplicação Angular com vitrine pública e painel administrativo para o catálogo da padaria. O cliente usa o Supabase Auth, PostgreSQL e Storage diretamente, com RLS protegendo o acesso administrativo.

## Requisitos

- Node.js suportado pelo Angular CLI 22.
- Projeto Supabase com PostgreSQL e Auth habilitados.

## Configuração local

1. No SQL Editor do Supabase, execute as migrations `001_catalog.sql`, `002_category_sizes.sql`, `003_admin_users.sql` e `004_supabase_auth_policies.sql`, nesta ordem.
2. Em Authentication > Users, crie manualmente o usuário administrador e confirme o e-mail.
3. No SQL Editor, autorize o UUID criado:

```sql
INSERT INTO public.admin_users (user_id, email)
SELECT id, email FROM auth.users WHERE email = 'seu-email@exemplo.com'
ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email, is_active = TRUE;
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

A migration `database/migrations/003_admin_users.sql` cria a autorização dos administradores ligada ao UUID de `auth.users`. A migration `004_supabase_auth_policies.sql` aplica RLS ao catálogo e cria o bucket `product-images`, permitindo escrita somente a administradores ativos. A URL pública e a chave publishable ficam em `src/app/core/config/supabase.config.ts`; a chave `service_role` não é usada no frontend.

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

