# Projeto Horizon

Sistema web de logistica com dois modos de uso:

- `server`: Node.js + Express + SQLite
- `browser`: site estatico com dados salvos no navegador

## Rodar localmente

1. Instale Node.js 18 ou superior.
2. No diretorio do projeto, execute:

```bash
npm install
npm start
```

3. Abra:

```text
http://localhost:3000
```

## Deploy mais simples com SQLite: Railway

Se voce quer hospedar com SQLite e gastar o minimo possivel, este e o caminho principal do projeto.

Arquivos ja preparados:

- `railway.json`: start e healthcheck
- `server.js`: loga a URL publica
- `src/database.js`: usa automaticamente o volume do Railway quando ele estiver conectado

### Passo a passo

1. Suba este projeto para o GitHub.
2. Na Railway, clique em `New Project`.
3. Escolha `Deploy from GitHub Repo`.
4. Selecione este repositorio.
5. Espere o primeiro deploy terminar.
6. Abra o servico e va em `Settings > Networking > Public Networking`.
7. Clique em `Generate Domain`.
8. No projeto, adicione um volume ao servico.
9. No volume, use como mount path:

```text
/data
```

10. Em `Variables`, defina:

```env
COOKIE_SECURE=true
APP_URL=https://seu-dominio.up.railway.app
MASTER_ADMIN_EMAIL=master@horizon.internal
MASTER_ADMIN_PASSWORD=defina-uma-senha-forte
```

11. Faca um `Redeploy`.
12. Abra a URL publica e use apenas credenciais internas configuradas pelo ambiente.

### Como o banco funciona na Railway

- se existir `DB_PATH`, o sistema usa esse valor
- se nao existir `DB_PATH`, mas houver volume Railway, o sistema salva automaticamente em `<mount-path>/logistica.db`
- com o mount path `/data`, o arquivo final fica em:

```text
/data/logistica.db
```

### Se voce ja tem um banco local

Se quiser levar seus dados atuais para a nuvem, copie o arquivo:

```text
data/logistica.db
```

para o volume da plataforma antes de usar em producao.

## Render com SQLite

O projeto tambem esta preparado para Render com o arquivo `render.yaml`, mas aqui existe uma limitacao importante:

- SQLite persistente no Render exige `persistent disk`
- `persistent disk` no Render e recurso de servico pago

Ou seja: para SQLite persistente, use Railway se quiser tentar ficar no plano gratuito, e use Render apenas se aceitar um plano pago.

### Passo rapido no Render

1. Crie um novo `Web Service` a partir do GitHub.
2. Use o arquivo `render.yaml` da raiz.
3. Mantenha o disk em `/data`.
4. O projeto ja define:

```env
DB_PATH=/data/logistica.db
COOKIE_SECURE=true
```

5. Conclua o deploy.

## Site estatico sem backend

Se voce quiser publicar sem servidor, o projeto tambem funciona em modo navegador:

- GitHub Pages
- Netlify
- qualquer hospedagem estatica

Nesse modo:

- nao usa `server.js`
- nao usa SQLite real
- salva tudo no `localStorage` do navegador

## Variaveis uteis

Arquivo de exemplo: `.env.example`

Variaveis principais:

```env
PORT=3000
DB_PATH=./data/logistica.db
COOKIE_SECURE=false
APP_URL=https://seu-dominio-publico.aqui
```

## Observacoes importantes

- SQLite e adequado para uma unica instancia do app
- nao escale este projeto para varias instancias usando o mesmo arquivo SQLite
- para varios usuarios com alta concorrencia, o melhor caminho futuro e PostgreSQL
