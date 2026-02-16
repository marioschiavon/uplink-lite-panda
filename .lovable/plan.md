

# Criar pagina de onboarding pre-cadastro para converter visitantes

## Problema

Quando o visitante clica em "Comecar agora" ou "Contratar agora", ele vai direto para a pagina de cadastro (formulario com nome/email/senha). Nao ha nenhuma explicacao do processo, do que vai acontecer apos criar a conta, ou como o produto funciona na pratica. Isso causa perda de interesse e abandono.

## Solucao

Criar uma pagina intermediaria `/get-started` que funciona como um **onboarding pre-cadastro** -- uma experiencia guiada que mostra ao visitante exatamente como o produto funciona antes de pedir que crie a conta.

### Estrutura da pagina `/get-started`

A pagina tera um layout de scroll vertical com secoes visuais e um CTA fixo no final:

**Secao 1 - Hero acolhedor**
- Titulo: "Veja como e facil comecar"
- Subtitulo: "Em apenas 3 passos voce tera sua API WhatsApp funcionando"

**Secao 2 - Como funciona (3 passos visuais)**
- Passo 1: "Crie sua conta" -- icone de usuario, descricao curta ("Cadastro rapido, sem cartao de credito inicial")
- Passo 2: "Configure sua sessao" -- icone de WhatsApp, descricao ("Conecte seu numero escaneando um QR Code")
- Passo 3: "Comece a enviar" -- icone de mensagem, descricao ("Use nossa API REST para integrar com qualquer sistema")

Cada passo tera uma animacao suave de entrada conforme o usuario rola a pagina.

**Secao 3 - O que esta incluso**
- Cards com os principais beneficios: mensagens ilimitadas, API REST completa, webhooks em tempo real, suporte dedicado
- Preco com destaque visual

**Secao 4 - Prova social / Confianca**
- Numero de mensagens enviadas pela plataforma
- "Sem fidelidade, cancele quando quiser"
- "Seus dados estao seguros"

**Secao 5 - CTA final**
- Botao grande "Criar minha conta gratis" que leva para `/signup`
- Texto: "Leva menos de 2 minutos"

### Mudanca nos CTAs

Todos os botoes "Comecar agora" e "Contratar agora" da landing page serao redirecionados de `/signup` para `/get-started`:
- Header: "Comecar Agora"
- Hero: CTA principal
- Secao de precos: "Contratar Agora"
- CTA final: botao de acao

O botao de "Login" continua indo para `/login` normalmente.

## Secao tecnica

### Arquivo a criar

| Arquivo | Descricao |
|---------|-----------|
| `src/pages/GetStarted.tsx` | Pagina de onboarding pre-cadastro com secoes animadas |

### Arquivos a modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/App.tsx` | Adicionar rota `/get-started` |
| `src/pages/Index.tsx` | Trocar `navigate("/signup")` por `navigate("/get-started")` nos 4 CTAs (linhas 291, 334, 663, 837) |
| `src/i18n/locales/pt-BR.json` | Adicionar textos da pagina get-started |
| `src/i18n/locales/en.json` | Adicionar textos em ingles |

### Detalhes tecnicos

- Usar `framer-motion` para animacoes de entrada das secoes (whileInView)
- Reutilizar componentes `Button`, `Card` ja existentes
- Usar icones do `lucide-react` (UserPlus, QrCode, Send, Zap, Shield, MessageSquare)
- Header simples com logo + botao "Voltar" para home
- Responsivo: layout adaptado para mobile com secoes empilhadas
- SEO com componente `SEO` ja existente
- Usar `useRegionalPricing` para exibir o preco correto na pagina
- O botao final "Criar minha conta" navega para `/signup`

### Fluxo completo apos a mudanca

```text
Landing "Comecar agora" → /get-started (explica como funciona) → /signup (cria conta) → /welcome (wizard) → Stripe (pagamento) → /dashboard
```

