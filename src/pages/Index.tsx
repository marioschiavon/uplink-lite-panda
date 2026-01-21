import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { useNavigate, Link } from "react-router-dom";
import { 
  Check, Zap, Shield, Clock, MessageSquare, ShoppingCart, Calendar, Package,
  Code2, Webhook, QrCode, Layers, Star, TrendingUp, Users, ChevronRight,
  Play, CheckCircle2, Sparkles, Timer, Headphones, FileCode
} from "lucide-react";
import { motion } from "framer-motion";
import { SEO } from "@/components/SEO";
import { Helmet } from "react-helmet-async";
import WhatsAppMockup from "@/components/landing/WhatsAppMockup";

const Index = () => {
  const navigate = useNavigate();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <SEO 
        browserTitle="UplinkLite"
        title="Melhor API WhatsApp Brasil | UplinkLite - R$ 69,90/mês"
        description="A melhor API WhatsApp do Brasil para automações empresariais. Configure em 5 minutos, envie mensagens ilimitadas por R$ 69,90/mês. Suporte em português 24/7. Integre com n8n, Make, Zapier."
        canonical="https://uplinklite.com/"
      />
      <Helmet>
        {/* Schema.org SoftwareApplication */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "UplinkLite - Melhor API WhatsApp do Brasil",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "description": "A UplinkLite é uma API WhatsApp brasileira que permite enviar mensagens ilimitadas por R$ 69,90/mês. Diferente da API oficial do WhatsApp Business que cobra por conversa, a UplinkLite oferece integração com ferramentas de automação como Make, Zapier, n8n e TypeBot, sem necessidade de aprovação como BSP (Business Solution Provider). Configure em 5 minutos.",
            "url": "https://uplinklite.com",
            "featureList": [
              "Mensagens ilimitadas por R$ 69,90/mês",
              "Configuração em 5 minutos",
              "Suporte 24/7 em português",
              "Integração com Make, Zapier, n8n e TypeBot",
              "Sem necessidade de aprovação BSP",
              "API RESTful completa",
              "Webhooks em tempo real",
              "99.9% de uptime"
            ],
            "offers": {
              "@type": "Offer",
              "price": "69.90",
              "priceCurrency": "BRL",
              "priceValidUntil": "2026-12-31"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "5",
              "reviewCount": "3",
              "bestRating": "5"
            },
            "provider": {
              "@type": "Organization",
              "name": "S7",
              "url": "https://uplinklite.com"
            }
          })}
        </script>
        
        {/* Schema.org Organization */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "UplinkLite",
            "url": "https://uplinklite.com",
            "logo": "https://uplinklite.com/logo-512.png",
            "description": "A melhor API WhatsApp do Brasil para automações empresariais",
            "contactPoint": {
              "@type": "ContactPoint",
              "contactType": "customer support",
              "availableLanguage": ["Portuguese"],
              "email": "suporte@uplinklite.com"
            },
            "sameAs": []
          })}
        </script>
        
        {/* Schema.org FAQPage */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "Por que a UplinkLite é a melhor API WhatsApp do Brasil?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "A UplinkLite é uma API WhatsApp brasileira que custa R$ 69,90/mês com mensagens ilimitadas. Diferente da API oficial do WhatsApp Business que cobra por conversa, a UplinkLite permite configuração em 5 minutos, oferece suporte 24/7 em português, integra com Make, Zapier, n8n e TypeBot, e não exige aprovação como BSP (Business Solution Provider)."
                }
              },
              {
                "@type": "Question",
                "name": "Quanto custa a API WhatsApp da UplinkLite?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "A UplinkLite custa R$ 69,90 por mês com mensagens ilimitadas incluídas. Não há cobrança por mensagem individual, diferente da API oficial do WhatsApp Business. O pagamento é mensal via cartão de crédito (Stripe) e pode ser cancelado a qualquer momento sem multas."
                }
              },
              {
                "@type": "Question",
                "name": "Preciso ser BSP do WhatsApp para usar a UplinkLite?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Não é necessário ser BSP (Business Solution Provider) para usar a UplinkLite. A API funciona de forma independente, permitindo que qualquer empresa envie mensagens via WhatsApp sem processo de aprovação do Meta ou do WhatsApp Business."
                }
              },
              {
                "@type": "Question",
                "name": "Quanto tempo leva para configurar a API WhatsApp?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "A configuração da UplinkLite leva menos de 5 minutos. O processo consiste em: criar conta, escanear QR Code com WhatsApp e começar a enviar mensagens. Não é necessário aprovação, documentação empresarial ou integração complexa."
                }
              },
              {
                "@type": "Question",
                "name": "A UplinkLite funciona com Make, Zapier e n8n?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Sim. A API WhatsApp da UplinkLite oferece integração nativa com as principais ferramentas de automação: Make (Integromat), Zapier, n8n e TypeBot. A API também pode ser integrada com qualquer sistema via requisições HTTP REST, incluindo Python, Node.js e PHP."
                }
              },
              {
                "@type": "Question",
                "name": "Existe limite de mensagens na API WhatsApp?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Não há limite de mensagens no plano da UplinkLite. Por R$ 69,90/mês você pode enviar quantas mensagens precisar para seus clientes, sem cobrança adicional por volume."
                }
              },
              {
                "@type": "Question",
                "name": "A UplinkLite oferece suporte técnico?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Sim. A UplinkLite oferece suporte técnico 24/7 em português via WhatsApp e email. A equipe de suporte auxilia com configuração, integração com ferramentas de automação e resolução de problemas técnicos."
                }
              }
            ]
          })}
        </script>
        
        {/* Schema.org HowTo */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "HowTo",
            "name": "Como configurar a API WhatsApp da UplinkLite",
            "description": "Configure sua API WhatsApp em 3 passos simples e comece a enviar mensagens automatizadas",
            "totalTime": "PT5M",
            "step": [
              {
                "@type": "HowToStep",
                "name": "Crie sua conta",
                "text": "Faça o cadastro em menos de 1 minuto com seu e-mail",
                "position": 1
              },
              {
                "@type": "HowToStep",
                "name": "Configure a sessão",
                "text": "Escaneie o QR Code com seu WhatsApp para conectar",
                "position": 2
              },
              {
                "@type": "HowToStep",
                "name": "Comece a enviar",
                "text": "Use nossa API para enviar mensagens automaticamente",
                "position": 3
              }
            ]
          })}
        </script>
      </Helmet>
      <div className="min-h-screen bg-background overflow-hidden">
        {/* Header Fixo */}
      <header className="fixed top-0 w-full bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 z-50 border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg animate-pulse-glow" />
              <img 
                src="/logo-uplink.png" 
                alt="Uplink - API WhatsApp para automações empresariais" 
                width="40"
                height="40"
                className="h-10 w-10 relative drop-shadow-lg rounded-full"
              />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Uplink
            </span>
            <Badge variant="secondary" className="text-xs">Lite</Badge>
          </motion.div>
          
          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollToSection("recursos")} className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Recursos
            </button>
            <button onClick={() => scrollToSection("integracoes")} className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Integrações
            </button>
            <button onClick={() => scrollToSection("precos")} className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Preços
            </button>
            <button onClick={() => navigate("/api-docs")} className="text-sm font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1">
              <FileCode className="h-4 w-4" />
              Docs
            </button>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button onClick={() => navigate("/login")} variant="ghost" size="sm" className="font-semibold hidden sm:inline-flex">
              Login
            </Button>
            <Button onClick={() => navigate("/checkout")} size="sm" className="font-semibold shadow-lg hover:shadow-xl transition-all animate-pulse-glow text-xs sm:text-sm">
              <span className="hidden xs:inline">Começar Agora</span>
              <span className="xs:hidden">Começar</span>
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section - Modernizado */}
      <section className="relative pt-32 pb-24 px-4 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium border border-primary/20">
                <Sparkles className="h-4 w-4" />
                <span>Melhor API WhatsApp para Automações</span>
              </div>

              <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                A Melhor API
                <br />
                <span className="bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent">
                  WhatsApp do Brasil
                </span>
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed">
                Configure sua API WhatsApp em 5 minutos sem burocracia. A alternativa mais simples e barata à API oficial. Suporte em português 24/7, pagamento em R$ e integração com n8n, Make e Zapier.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-4">
                <Button 
                  onClick={() => navigate("/checkout")} 
                  size="lg" 
                  className="text-lg h-14 px-10 shadow-elegant hover:shadow-glow transition-all group"
                >
                  Começar Agora
                  <Play className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  onClick={() => scrollToSection("integracoes")} 
                  variant="outline" 
                  size="lg"
                  className="text-lg h-14 px-10"
                >
                  Ver Integrações
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-6">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span className="font-medium">Suporte em Português</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span className="font-medium">99.9% Uptime</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span className="font-medium">Pagamento em R$</span>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-secondary/30 rounded-[3rem] blur-3xl animate-pulse-glow" />
              <WhatsAppMockup />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Métricas/Prova Social */}
      <section className="py-16 px-4 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-y border-primary/10">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center space-y-2"
            >
              <div className="text-4xl md:text-5xl font-bold text-primary">+10K</div>
              <div className="text-sm text-muted-foreground">Mensagens Enviadas</div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center space-y-2"
            >
              <div className="text-4xl md:text-5xl font-bold text-primary">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center space-y-2"
            >
              <div className="text-4xl md:text-5xl font-bold text-primary">&lt; 5min</div>
              <div className="text-sm text-muted-foreground">Para Configurar</div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-center space-y-2"
            >
              <div className="text-4xl md:text-5xl font-bold text-primary">24/7</div>
              <div className="text-sm text-muted-foreground">Suporte Disponível</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Recursos/Features - Novo Design */}
      <section id="recursos" className="py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 space-y-4"
          >
            <Badge variant="outline" className="mb-2">Recursos Poderosos</Badge>
            <h2 className="text-4xl md:text-5xl font-bold">
              Tudo que você precisa para
              <br />
              <span className="text-primary">automatizar o WhatsApp</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Uma API completa com todas as funcionalidades que sua empresa precisa
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: MessageSquare,
                title: "Envio de Mensagens",
                description: "Envie texto, imagens, áudio, vídeo e documentos com facilidade total",
                color: "text-blue-500",
                bg: "bg-blue-500/10",
                border: "border-blue-500/20"
              },
              {
                icon: Webhook,
                title: "Webhooks em Tempo Real",
                description: "Receba notificações instantâneas de status e respostas de mensagens",
                color: "text-purple-500",
                bg: "bg-purple-500/10",
                border: "border-purple-500/20"
              },
              {
                icon: QrCode,
                title: "QR Code Dinâmico",
                description: "Conecte o WhatsApp em segundos escaneando o QR Code gerado",
                color: "text-green-500",
                bg: "bg-green-500/10",
                border: "border-green-500/20"
              },
              {
                icon: Code2,
                title: "API RESTful Completa",
                description: "Documentação clara com exemplos em múltiplas linguagens",
                color: "text-orange-500",
                bg: "bg-orange-500/10",
                border: "border-orange-500/20"
              },
              {
                icon: Layers,
                title: "Múltiplas Instâncias",
                description: "Gerencie várias sessões WhatsApp em uma única conta",
                color: "text-pink-500",
                bg: "bg-pink-500/10",
                border: "border-pink-500/20"
              },
              {
                icon: Shield,
                title: "Segurança Garantida",
                description: "Criptografia end-to-end e tokens seguros para suas mensagens",
                color: "text-red-500",
                bg: "bg-red-500/10",
                border: "border-red-500/20"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`group border-2 ${feature.border} hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer h-full`}>
                  <CardHeader className="space-y-4">
                    <div className={`w-14 h-14 ${feature.bg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <feature.icon className={`h-7 w-7 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                      {feature.title}
                    </CardTitle>
                    <CardDescription className="text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Seção de Integrações */}
      <section id="integracoes" className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 space-y-4"
          >
            <Badge variant="outline" className="mb-2">Integrações</Badge>
            <h2 className="text-4xl md:text-5xl font-bold">
              Integre com suas
              <br />
              <span className="text-primary">ferramentas favoritas</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A melhor API WhatsApp para n8n, Make, Zapier e todas as linguagens de programação
            </p>
          </motion.div>

          {/* Grid de Logos */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
          >
            {[
              { name: "n8n", desc: "Automação", logo: "https://cdn.simpleicons.org/n8n/FF6D5A" },
              { name: "Make", desc: "Integração", logo: "https://cdn.simpleicons.org/make/6D00CC" },
              { name: "Zapier", desc: "Workflows", logo: "https://cdn.simpleicons.org/zapier/FF4A00" },
              { name: "Bubble", desc: "No-Code", logo: "https://images.seeklogo.com/logo-png/44/1/bubble-icon-logo-png_seeklogo-448116.png" },
              { name: "Python", desc: "Linguagem", logo: "https://cdn.simpleicons.org/python/3776AB" },
              { name: "Node.js", desc: "JavaScript", logo: "https://cdn.simpleicons.org/nodedotjs/339933" },
              { name: "PHP", desc: "Backend", logo: "https://cdn.simpleicons.org/php/777BB4" },
              { name: "Google Sheets", desc: "Planilhas", logo: "https://cdn.simpleicons.org/googlesheets/34A853" }
            ].map((integration, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                className="relative group"
              >
                <Card className="h-full border-2 hover:border-primary/50 transition-all cursor-pointer">
                  <CardContent className="flex flex-col items-center justify-center p-8 space-y-3">
                    <div className="w-12 h-12 rounded-lg bg-background flex items-center justify-center">
                      <img 
                        src={integration.logo} 
                        alt={`Integração da API WhatsApp Uplink com ${integration.name} para ${integration.desc}`}
                        loading="lazy"
                        decoding="async"
                        width="32"
                        height="32"
                        className="h-8 w-8 object-contain" 
                      />
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-lg">{integration.name}</p>
                      <p className="text-sm text-muted-foreground">{integration.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </section>

      {/* Como Funciona - Redesenhado */}
      <section id="como-funciona" className="py-24 px-4">
        <div className="container mx-auto max-w-5xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 space-y-4"
          >
            <Badge variant="outline" className="mb-2">Simples e Rápido</Badge>
            <h2 className="text-4xl md:text-5xl font-bold">
              Comece em <span className="text-primary">3 passos</span>
            </h2>
          </motion.div>

          <div className="space-y-8">
            {[
              {
                number: "1",
                title: "Crie sua conta",
                description: "Cadastro rápido em menos de 1 minuto. Acesse o painel de controle.",
                icon: Users,
                color: "from-blue-500 to-blue-600"
              },
              {
                number: "2",
                title: "Configure sua sessão",
                description: "Dentro do painel, crie uma nova sessão de API com um clique.",
                icon: QrCode,
                color: "from-purple-500 to-purple-600"
              },
              {
                number: "3",
                title: "Comece a enviar",
                description: "Copie as credenciais e integre com seu sistema, chatbot ou automação.",
                icon: Zap,
                color: "from-green-500 to-green-600"
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative"
              >
                {index < 2 && (
                  <div className="hidden md:block absolute left-8 top-20 w-0.5 h-16 bg-gradient-to-b from-primary to-transparent" />
                )}
                <Card className="border-2 hover:border-primary/50 hover:shadow-2xl transition-all group">
                  <CardContent className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center sm:items-start p-6 sm:p-8">
                    <div className={`relative flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white text-xl sm:text-2xl font-bold shadow-lg group-hover:scale-110 transition-transform`}>
                      {step.number}
                      <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-white/20 group-hover:animate-pulse" />
                    </div>
                    <div className="flex-1 space-y-2 sm:space-y-3 text-center sm:text-left">
                      <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3">
                        <step.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                        <h3 className="text-xl sm:text-2xl font-bold">{step.title}</h3>
                      </div>
                      <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Preços - Modernizado */}
      <section id="precos" className="py-24 px-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto max-w-5xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 space-y-4"
          >
            <Badge variant="outline" className="mb-2">Preços Transparentes</Badge>
            <h2 className="text-4xl md:text-5xl font-bold">
              Plano simples,
              <br />
              <span className="text-primary">sem surpresas</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Sem taxas escondidas, sem burocracia
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <Card className="max-w-lg mx-auto border-2 border-primary shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-gradient-to-br from-primary to-secondary text-white px-6 py-2 rounded-bl-2xl font-bold text-sm">
                MAIS POPULAR
              </div>
              
              <CardHeader className="text-center pb-8 pt-12 space-y-6">
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-lg">
                  <Zap className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-3xl">Sessão API WhatsApp</CardTitle>
                <div className="space-y-2">
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-5xl font-bold text-primary">R$ 69,90</span>
                    <span className="text-muted-foreground text-xl">/mês</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Por sessão ativa</p>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6 px-8 pb-8">
                <div className="space-y-4">
                  {[
                    "1 sessão de API WhatsApp",
                    "Configuração em minutos",
                    "Mensagens ilimitadas",
                    "Webhooks em tempo real",
                    "Documentação completa",
                    "Suporte técnico 24/7",
                    "Sem taxa de adesão",
                    "Cancele quando quiser"
                  ].map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-3"
                    >
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-foreground">{feature}</span>
                    </motion.div>
                  ))}
                </div>

                <Button 
                  onClick={() => navigate("/checkout")} 
                  className="w-full h-14 text-lg mt-6 shadow-elegant hover:shadow-glow transition-all group"
                  size="lg"
                >
                  Contratar Agora
                  <ChevronRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                
              <p className="text-center text-sm text-muted-foreground">
                ✓ Cancele a qualquer momento • Sem fidelidade
              </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Casos de Uso */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 space-y-4"
          >
            <Badge variant="outline" className="mb-2">Casos de Uso</Badge>
            <h2 className="text-4xl md:text-5xl font-bold">
              Perfeito para
              <br />
              <span className="text-primary">qualquer negócio</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: ShoppingCart,
                title: "E-commerce",
                items: [
                  "Confirmação de pedidos",
                  "Status de pagamento",
                  "Rastreamento de entrega",
                  "Pós-venda automatizado"
                ],
                color: "text-blue-500",
                bg: "bg-blue-500/10"
              },
              {
                icon: Calendar,
                title: "Agendamentos",
                items: [
                  "Confirmação de consultas",
                  "Lembretes automáticos",
                  "Reagendamentos",
                  "Pesquisa de satisfação"
                ],
                color: "text-purple-500",
                bg: "bg-purple-500/10"
              },
              {
                icon: Package,
                title: "Logística",
                items: [
                  "Status de envio",
                  "Atualização de localização",
                  "Tentativas de entrega",
                  "Confirmação de recebimento"
                ],
                color: "text-green-500",
                bg: "bg-green-500/10"
              },
              {
                icon: MessageSquare,
                title: "Automações",
                items: [
                  "Integração com CRM",
                  "Notificações de eventos",
                  "Alertas de pagamento",
                  "Confirmações automáticas"
                ],
                color: "text-orange-500",
                bg: "bg-orange-500/10"
              }
            ].map((useCase, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-2 hover:border-primary/50 hover:shadow-2xl transition-all group h-full">
                  <CardHeader className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 ${useCase.bg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <useCase.icon className={`h-7 w-7 ${useCase.color}`} />
                      </div>
                      <CardTitle className="text-2xl">{useCase.title}</CardTitle>
                    </div>
                    <div className="space-y-3 pt-4">
                      {useCase.items.map((item, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{item}</span>
                        </div>
                      ))}
                    </div>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Depoimentos Melhorados */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 space-y-4"
          >
            <Badge variant="outline" className="mb-2">Depoimentos</Badge>
            <h2 className="text-4xl md:text-5xl font-bold">
              Empresas que já
              <br />
              <span className="text-primary">automatizaram</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Ricardo Mendes",
                role: "CEO - ShopFast E-commerce",
                text: "Integramos a Uplink em nosso sistema de pedidos e reduzimos em 70% o tempo de resposta aos clientes. A configuração foi surpreendentemente simples.",
                rating: 5
              },
              {
                name: "Dra. Paula Santos",
                role: "Diretora - Clínica MedSaúde",
                text: "Automatizamos todos os lembretes de consulta. Taxa de comparecimento aumentou 40%. O suporte é excepcional e sempre em português.",
                rating: 5
              },
              {
                name: "Carlos Oliveira",
                role: "CTO - LogFast Entregas",
                text: "API estável e confiável. Enviamos milhares de mensagens por dia sem problemas. O custo-benefício é imbatível.",
                rating: 5
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-2 hover:shadow-2xl transition-all h-full">
                  <CardContent className="pt-6 space-y-6">
                    <div className="flex gap-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                      ))}
                    </div>
                    <p className="text-muted-foreground italic leading-relaxed">
                      "{testimonial.text}"
                    </p>
                    <div className="border-t pt-4 space-y-1">
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-4">
        <div className="container mx-auto max-w-3xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 space-y-4"
          >
            <Badge variant="outline" className="mb-2">FAQ</Badge>
            <h2 className="text-4xl md:text-5xl font-bold">
              Dúvidas <span className="text-primary">frequentes</span>
            </h2>
          </motion.div>

          <Accordion type="single" collapsible className="space-y-4">
            {[
              {
                question: "Por que a UplinkLite é a melhor API WhatsApp do Brasil?",
                answer: "A UplinkLite é uma API WhatsApp brasileira que custa R$ 69,90/mês com mensagens ilimitadas. Diferente da API oficial do WhatsApp Business que cobra por conversa, a UplinkLite permite configuração em 5 minutos, oferece suporte 24/7 em português, integra com Make, Zapier, n8n e TypeBot, e não exige aprovação como BSP (Business Solution Provider)."
              },
              {
                question: "Quanto custa a API WhatsApp da UplinkLite?",
                answer: "A UplinkLite custa R$ 69,90 por mês com mensagens ilimitadas incluídas. Não há cobrança por mensagem individual, diferente da API oficial do WhatsApp Business. O pagamento é mensal via cartão de crédito (Stripe) e pode ser cancelado a qualquer momento sem multas."
              },
              {
                question: "Preciso ser BSP do WhatsApp para usar a UplinkLite?",
                answer: "Não é necessário ser BSP (Business Solution Provider) para usar a UplinkLite. A API funciona de forma independente, permitindo que qualquer empresa envie mensagens via WhatsApp sem processo de aprovação do Meta ou do WhatsApp Business."
              },
              {
                question: "Quanto tempo leva para configurar a API WhatsApp?",
                answer: "A configuração da UplinkLite leva menos de 5 minutos. O processo consiste em: criar conta, escanear QR Code com WhatsApp e começar a enviar mensagens. Não é necessário aprovação, documentação empresarial ou integração complexa."
              },
              {
                question: "A UplinkLite funciona com Make, Zapier e n8n?",
                answer: "Sim. A API WhatsApp da UplinkLite oferece integração nativa com as principais ferramentas de automação: Make (Integromat), Zapier, n8n e TypeBot. A API também pode ser integrada com qualquer sistema via requisições HTTP REST, incluindo Python, Node.js e PHP."
              },
              {
                question: "Existe limite de mensagens na API WhatsApp?",
                answer: "Não há limite de mensagens no plano da UplinkLite. Por R$ 69,90/mês você pode enviar quantas mensagens precisar para seus clientes, sem cobrança adicional por volume."
              },
              {
                question: "A UplinkLite oferece suporte técnico?",
                answer: "Sim. A UplinkLite oferece suporte técnico 24/7 em português via WhatsApp e email. A equipe de suporte auxilia com configuração, integração com ferramentas de automação e resolução de problemas técnicos."
              },
              {
                question: "Como funciona o pagamento da UplinkLite?",
                answer: "O pagamento da UplinkLite é feito mensalmente via cartão de crédito (Stripe). O valor é R$ 69,90/mês com renovação automática. Você pode cancelar a qualquer momento pelo painel, sem multas ou taxas adicionais."
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <AccordionItem value={`item-${index}`} className="border-2 rounded-lg px-6 hover:border-primary/50 transition-colors">
                  <AccordionTrigger className="text-left font-semibold hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 px-4 bg-gradient-to-r from-primary to-secondary relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20" />
        
        <div className="container mx-auto max-w-4xl relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center space-y-8 text-white"
          >
            <h2 className="text-4xl md:text-6xl font-bold">
              Pronto para automatizar
              <br />
              seu WhatsApp?
            </h2>
            <p className="text-xl md:text-2xl opacity-90 max-w-2xl mx-auto">
              Configure em minutos e comece a enviar mensagens automáticas hoje mesmo
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Button 
                onClick={() => navigate("/checkout")}
                size="lg"
                variant="secondary"
                className="text-lg h-16 px-12 shadow-2xl hover:scale-105 transition-all"
              >
                Começar Agora - R$ 69,90/mês
                <ChevronRight className="h-5 w-5 ml-2" />
              </Button>
              <Button 
                onClick={() => navigate("/api-docs")}
                size="lg"
                variant="outline"
                className="text-lg h-16 px-12 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 hover:text-white"
              >
                Ver Documentação
              </Button>
            </div>
              <p className="text-sm opacity-75 pt-4">
                ✓ Configuração em minutos • Suporte em português • Cancele quando quiser
              </p>
          </motion.div>
        </div>
      </section>

      {/* Footer Expandido */}
      <footer className="bg-background border-t border-border py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
              <img 
                  src="/logo-uplink.png" 
                  alt="Uplink - API WhatsApp para automações empresariais"
                  loading="lazy"
                  width="40"
                  height="40"
                  className="h-10 w-10 rounded-full"
                />
                <span className="text-xl font-bold">Uplink</span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                A melhor API WhatsApp do Brasil. Automatize a comunicação da sua empresa em minutos com a alternativa mais simples e barata do mercado.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Produto</h3>
              <div className="space-y-3 text-sm">
                <button onClick={() => scrollToSection("recursos")} className="block text-muted-foreground hover:text-primary transition-colors">
                  Recursos
                </button>
                <button onClick={() => scrollToSection("precos")} className="block text-muted-foreground hover:text-primary transition-colors">
                  Preços
                </button>
                <button onClick={() => navigate("/api-docs")} className="block text-muted-foreground hover:text-primary transition-colors">
                  Documentação
                </button>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Empresa</h3>
              <div className="space-y-3 text-sm">
                <button onClick={() => navigate("/terms")} className="block text-muted-foreground hover:text-primary transition-colors">
                  Termos de Uso
                </button>
                <button onClick={() => navigate("/privacy")} className="block text-muted-foreground hover:text-primary transition-colors">
                  Política de Privacidade
                </button>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Suporte</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Headphones className="h-4 w-4 text-primary" />
                  <span>Suporte 24/7</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Em Português</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 Uplink Lite. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-4 text-muted-foreground">
              <Badge variant="outline" className="gap-2">
                <Shield className="h-3 w-3" />
                SSL Seguro
              </Badge>
              <Badge variant="outline" className="gap-2">
                <CheckCircle2 className="h-3 w-3" />
                99.9% Uptime
              </Badge>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </>
  );
};

export default Index;
