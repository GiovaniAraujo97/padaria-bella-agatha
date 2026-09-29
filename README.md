# PadariaBellaAgatha

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.1.4.

# Padaria Bella Agatha

Aplicação Angular com vitrine pública e painel administrativo para o catálogo da padaria. A API é servida pelo Express SSR e usa PostgreSQL; imagens são armazenadas como URLs, pois o projeto não possuía serviço de upload.

## Requisitos

- Node.js suportado pelo Angular CLI 22 e com suporte a `--env-file`.
- PostgreSQL 13 ou superior, acessível pelo servidor da aplicação.

## Configuração local

1. Execute `npm run admin:bootstrap` para criar `.env` com um administrador temporário. O comando exibe o e-mail e a senha uma única vez; guarde a senha. O arquivo contém somente o hash e o segredo de sessão.
2. Configure `DATABASE_URL` em `.env` com a URL privada do PostgreSQL quando o banco estiver disponível.
3. Aplique o schema e os dados demonstrativos com `npm run db:migrate`.
4. Compile e execute o servidor que hospeda a API e o SSR:

Para trocar a senha depois, execute `npm run admin:password`, informe a nova senha no prompt oculto e reinicie o servidor.

```powershell
npm install
npm run build
npm run serve:production
```

Abra `http://localhost:4000/`. O painel fica em `/admin/login`. O comando `npm start` continua disponível para desenvolvimento Angular; a API persistente exige que o servidor Express seja executado com as variáveis de ambiente configuradas.

Não versione o arquivo `.env`. Em produção, use HTTPS e defina `NODE_ENV=production` para ativar o atributo `Secure` do cookie. O segredo PostgreSQL deve existir apenas no servidor e ter permissões restritas; use uma URL com SSL conforme as exigências do provedor.

Inclua o hostname público da implantação em `security.allowedHosts` no `angular.json`; `localhost` já está permitido para desenvolvimento. A lista continua restrita para proteger o SSR contra cabeçalhos `Host` arbitrários.

## Banco e autorização

A migration `database/migrations/001_catalog.sql` cria `categories`, `products` e `product_sizes`, com chaves estrangeiras, restrições, índices, datas e políticas RLS. Categorias não podem ser apagadas enquanto houver produtos associados; tamanhos são apagados junto com o produto. Visitantes consultam apenas categorias visíveis e produtos publicados. A disponibilidade é separada da publicação para sinalizar itens temporariamente indisponíveis.

A migration `database/migrations/002_category_sizes.sql` adiciona a opção `has_sizes` às categorias e marca Bolos e Tortas como categorias com tamanhos diferentes. No painel, uma categoria contém somente nome e a opção de permitir tamanhos; slug, ícone e ordem são definidos automaticamente.

A migration inicial inclui, sem substituir registros existentes, as categorias e os oito produtos que já estavam no mock da vitrine. Eles são conteúdo demonstrativo e devem ser revisados antes de publicação comercial. O bootstrap cria um único administrador temporário em `.env`; a senha usa scrypt e a sessão é assinada em cookie HttpOnly/SameSite. A autenticação funciona sem PostgreSQL, mas o CRUD exige `DATABASE_URL` e a migration aplicada. Quando as contas forem movidas para o banco, remova a credencial temporária e migre a autorização para usuários cadastrados; não existe cadastro público de administradores.

## Uso do painel

- `/admin/login`: autenticação do administrador configurado no servidor.
- Produtos: cadastro, edição, exclusão com confirmação, categoria, preço base, tamanhos, imagem por URL, ordenação, destaque, publicação e disponibilidade.
- Categorias: cadastro e edição de nome e permissão para tamanhos diferentes; metadados técnicos são automáticos e a exclusão respeita produtos associados.
- `/produtos`: busca por nome/descrição e filtros por categoria. Produtos publicados mas indisponíveis continuam visíveis e não podem ser adicionados ao carrinho.

Para usar imagens, informe uma URL HTTPS pública ou um caminho servido pela própria aplicação. Não há armazenamento/upload de arquivos configurado.

## Verificações

```powershell
npm run build
npm test -- --watch=false
```

Para desenvolvimento Angular, execute `npm start` e acesse `http://localhost:4200/`.

