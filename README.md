# RepMind - AI Personal Trainer

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=3ECF8E)
![n8n](https://img.shields.io/badge/n8n-FF6584?style=for-the-badge&logo=n8n&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)

**RepMind** é uma plataforma híbrida de gestão de treinos que combina uma aplicação Web moderna para planejamento e um Agente de IA via WhatsApp para acompanhamento em tempo real.

O objetivo é separar a **estratégia** (Web) da **execução** (WhatsApp), oferecendo uma experiência de "Personal Trainer de Bolso".

---

## Funcionalidades

### Aplicação Web (Frontend)
- **Gestão de Rotinas:** Criação, edição e exclusão de treinos personalizados.
- **Catálogo de Exercícios:** Busca inteligente com filtros por grupo muscular.
- **Drag & Drop:** Reordenação intuitiva da ordem dos exercícios na rotina.
- **Vídeos Demonstrativos:** Player integrado para visualizar a execução correta.
- **Autenticação OTP:** Login seguro via e-mail com código gerado por Webhook.
- **Manual Interativo:** Página "Como Usar" integrada ensinando a interagir com o Agente.

### Agente IA (Backend/n8n)
- **Assistente via WhatsApp:** Conversa natural para tirar dúvidas sobre fitness (RAG).
- **Log de Treino:** O usuário fala o que treinou ("Fiz supino com 30kg") e a IA registra no banco.
- **Envio de Mídia:** Envia vídeos e explicações dos exercícios solicitados.
- **Memória Contextual:** Lembra do histórico de conversa e do treino atual do usuário.

---

## Tecnologias Utilizadas

- **Frontend:** React, Vite, TypeScript, Lucide Icons.
- **Backend / Database:** Supabase (PostgreSQL, Auth, Vector Store).
- **Orquestração & IA:** n8n (Self-hosted), LangChain, OpenAI GPT-4o-mini.
- **Mensageria:** WhatsApp API (via Evolution API ou similar).

---

## Como Executar o Projeto

### Pré-requisitos
- Node.js instalado (v18+).
- Conta no Supabase.
- Instância do n8n rodando.

### 1. Instalação
Clone o repositório e instale as dependências:

```bash
git clone [https://github.com/seu-usuario/repmind.git](https://github.com/seu-usuario/repmind.git)
cd repmind
npm install
```

### 2. Configuração das Variáveis de ambiente
Crie um arquivo `.env.local` na raiz do projeto

```yaml
# Supabase
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima

# Webhooks do n8n (Autenticação)
# Crie workflows no n8n para receber esses disparos
VITE_N8N_WEBHOOK_AUTH=[https://seu-n8n.com/webhook/enviar-codigo](https://seu-n8n.com/webhook/enviar-codigo)
VITE_N8N_WEBHOOK_VERIFY=[https://seu-n8n.com/webhook/validar-codigo](https://seu-n8n.com/webhook/validar-codigo)
```

### 3. Rodando a Aplicação
Dentro da pasta front
```bash
npm run dev
```

Acesse : `http://localhost:5173`

---

## Estrutura do Banco de Dados (supabase)
O sistema depende das seguintes tabelas principais no PostgreSQL:

1. clientes: Dados do usuário (id, email, telefone).

2. rotinas_treino: Cabeçalho dos treinos (id, titulo, cliente_id).

3. exercicios_normalizados: Catálogo mestre (id, nome, grupo_muscular, video_url, descricao).

4. exercicios_rotina: Tabela pivô (id, rotina_id, exercicio_id, ordem, series, reps).

5. sessao_treino: Controle de treino ativo (id, cliente_id, inicio, fim).

6. series_log: Histórico de execução (id, sessao_id, exercicio_id, carga, reps).

Nota: É necessário configurar o Vector Store no Supabase para o funcionamento do RAG (Dúvidas gerais de fitness).