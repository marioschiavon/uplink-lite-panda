

# Criar pagina FAQ dedicada e melhorar fluxo de primeiro contato

## Problema atual

1. **Botao "Comecar agora"** redireciona para `/checkout`, que exige login. Se o usuario nao esta logado, recebe um toast de erro e e jogado para `/login` -- experiencia fria e confusa para um novo visitante.

2. **Nao existe pagina FAQ dedicada**. O FAQ atual e apenas uma secao dentro da landing page (`Index.tsx`), sem rota propria.

## Mudancas propostas

### 1. Pagina FAQ dedicada (`/faq`)

Criar `src/pages/FAQ.tsx` com:
- Header com logo e navegacao (voltar para home)
- Todas as perguntas ja existentes no i18n (`faq.questions`)
- Accordion estilizado (mesmo componente ja usado na landing)
- Link para contato/suporte no final
- SEO otimizado com schema FAQPage
- Link no footer da landing page apontando para `/faq`

### 2. Redirecionar "Comecar agora" para `/signup`

Atualmente todos os botoes CTA da landing (`nav.startNow`, `hero.cta`, `cta.button`, `pricing.cta`) navegam para `/checkout`.

Mudanca: redirecionar para `/signup` em vez de `/checkout`. O fluxo correto sera:

```text
Landing "Comecar agora" → /signup (criar conta) → /welcome (onboarding wizard) → /checkout (pagamento)
```

### 3. Melhorar a pagina de Signup para ser mais acolhedora

A pagina atual (`Signup.tsx`) e um formulario simples com logo + campos. Para um primeiro contato, ela precisa transmitir mais valor.

Melhorias:
- Layout em duas colunas (desktop): lado esquerdo com beneficios/valor, lado direito com formulario
- Lado esquerdo mostra: titulo acolhedor, 3-4 beneficios com icones (configuracao em 5 min, mensagens ilimitadas, suporte 24/7, cancele quando quiser)
- Mobile: beneficios aparecem acima do formulario de forma compacta
- Botao "Voltar" para a landing page
- Manter o link "Ja tem conta? Entrar" existente

## Secao tecnica

### Arquivos a criar

| Arquivo | Descricao |
|---------|-----------|
| `src/pages/FAQ.tsx` | Pagina dedicada de FAQ com accordion e SEO |

### Arquivos a modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/pages/Signup.tsx` | Layout duas colunas com beneficios + formulario, botao voltar |
| `src/pages/Index.tsx` | Trocar `navigate("/checkout")` por `navigate("/signup")` nos 4 CTAs principais. Adicionar link FAQ no footer |
| `src/App.tsx` | Adicionar rota `/faq` |
| `src/i18n/locales/pt-BR.json` | Adicionar textos da pagina FAQ e beneficios do signup |
| `src/i18n/locales/en.json` | Adicionar textos da pagina FAQ e beneficios do signup em ingles |

### Detalhes da pagina FAQ

- Reutilizar `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent` ja existentes
- Reutilizar as perguntas de `faq.questions` do i18n (8 perguntas ja cadastradas)
- Adicionar secao de contato no final: "Ainda tem duvidas? Entre em contato com nosso suporte"
- Schema.org FAQPage para SEO

### Detalhes do Signup melhorado

```text
+------------------------------------------+
|  [Voltar]                                |
|                                          |
|  +----------------+  +----------------+ |
|  | LADO ESQUERDO  |  | LADO DIREITO   | |
|  |                |  |                | |
|  | Logo Uplink    |  | [Formulario]   | |
|  | "Comece a      |  | Nome           | |
|  |  automatizar"  |  | Email          | |
|  |                |  | Senha          | |
|  | * Config 5min  |  |                | |
|  | * Ilimitado    |  | [Criar Conta]  | |
|  | * Suporte 24/7 |  |                | |
|  | * Sem multa    |  | Ja tem conta?  | |
|  +----------------+  +----------------+ |
+------------------------------------------+
```

### Mudancas nos CTAs da Index.tsx

Linhas a alterar (todas as ocorrencias de `navigate("/checkout")`):
- Linha 291: botao header "Comecar Agora" → `navigate("/signup")`
- Linha 334: botao hero CTA → `navigate("/signup")`
- Linha 837: botao CTA final → `navigate("/signup")`
- Secao de precos (buscar a linha exata): botao "Contratar Agora" → `navigate("/signup")`

### Ordem de implementacao

1. Criar `FAQ.tsx` e registrar rota em `App.tsx`
2. Atualizar `Index.tsx`: CTAs para `/signup` + link FAQ no footer
3. Atualizar `Signup.tsx` com layout acolhedor
4. Atualizar arquivos i18n com novos textos

