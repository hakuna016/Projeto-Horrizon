# Sistema Web de Logística para Frigorífico

MVP web completo para operação logística diária, com backend em Node.js, persistência em SQLite local e frontend responsivo para desktop e celular.

## O que o sistema entrega

- Login com usuário e senha
- Cadastro por código de convite
- Perfis: `ADMIN`, `MANAGER`, `OPERATIONAL`
- Dashboard com métricas, alertas, combustível e escala do dia
- Notas fiscais com cadastro manual, importação XML e importação de planilha
- Aprendizado de categoria por fornecedor
- Estoque com produtos, entradas, saídas, histórico e estoque mínimo
- Leitura por câmera para código de barras via navegador compatível
- Abastecimento com saldo após cada operação
- Escala, multas e checklists
- Central de Emails com filtro simples de spam, detecção de XML e criação automática de nota
- Log de ações persistido no banco

## Stack

- Frontend: HTML, CSS e JavaScript puro
- Backend: Node.js + Express
- Banco: SQLite em arquivo local usando `sql.js`

## Estrutura

- `server.js`: servidor HTTP e APIs
- `src/database.js`: inicialização do banco, schema e seed inicial
- `src/security.js`: hash de senha, sessão e cookies
- `src/parsers.js`: importação XML, planilha e leitura de email
- `public/`: interface web responsiva
- `data/logistica.db`: banco SQLite criado automaticamente ao iniciar

## Como rodar localmente

1. Instale o Node.js 18 ou superior.
2. No diretório do projeto, execute:

```bash
npm install
npm start
```

3. Acesse no navegador:

```text
http://localhost:3000
```

## Acesso inicial

- Email: `admin@frigorifico.local`
- Senha: `admin123`

## Convites iniciais

- Administrador: `ADM-LOG-2026`
- Gerente: `GER-LOG-2026`
- Operacional: `OPE-LOG-2026`

## Observações do MVP

- O banco é persistido em arquivo local `.db`, sem depender de `localStorage`.
- As tabelas são criadas automaticamente na primeira inicialização.
- O scanner por câmera usa `BarcodeDetector`, disponível em navegadores compatíveis.
- A central de emails foi desenhada para processamento local de conteúdo colado/exportado, sem depender de credenciais IMAP no MVP.

## Observação desta entrega

O ambiente atual não possui Node.js instalado em `PATH`, então o projeto foi estruturado completo, mas não pôde ser executado nem testado nesta máquina durante esta sessão. Assim que o Node estiver instalado, os comandos acima devem permitir a inicialização local.
