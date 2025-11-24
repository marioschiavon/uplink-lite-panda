import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useNavigate } from "react-router-dom";
import { Check, Zap, Shield, Clock, MessageSquare, ShoppingCart, Calendar, Package } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Fixo */}
      <header className="fixed top-0 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50 border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/logo-uplink.png" 
              alt="Uplink Logo" 
              className="h-10 w-10 drop-shadow-lg rounded-full"
            />
            <span className="text-2xl font-bold text-foreground">Uplink</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <button onClick={() => scrollToSection("como-funciona")} className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Como funciona
            </button>
            <button onClick={() => scrollToSection("precos")} className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Preços
            </button>
            <button onClick={() => scrollToSection("faq")} className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              FAQ
            </button>
          </nav>

          <Button onClick={() => navigate("/login")} variant="outline" className="font-semibold">
            Login
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-5xl md:text-6xl font-bold leading-tight text-foreground">
                Automatize o WhatsApp da sua empresa{" "}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  em minutos
                </span>
              </h1>
              
              <p className="text-xl text-muted-foreground">
                Crie sua sessão, receba os dados da API e comece a enviar mensagens automatizadas para seus clientes.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button 
                  onClick={() => navigate("/checkout")} 
                  size="lg" 
                  className="text-lg h-14 px-8 shadow-elegant hover:shadow-glow transition-all"
                >
                  Começar agora
                </Button>
                <Button 
                  onClick={() => navigate("/login")} 
                  variant="outline" 
                  size="lg"
                  className="text-lg h-14 px-8"
                >
                  Fazer Login
                </Button>
              </div>

              <div className="flex items-center gap-4 pt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-primary" />
                  <span>Sem burocracia</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-primary" />
                  <span>Configuração em minutos</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl blur-3xl" />
              <Card className="relative border-2 border-primary/20 shadow-elegant">
                <CardContent className="p-8 space-y-4">
                  <div className="flex items-center gap-3 text-primary">
                    <MessageSquare className="h-12 w-12" />
                    <div>
                      <p className="font-semibold text-foreground">WhatsApp API</p>
                      <p className="text-sm text-muted-foreground">Pronta para usar</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 pt-4">
                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <Package className="h-5 w-5 text-primary mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-foreground">Seu pedido está a caminho!</p>
                        <p className="text-muted-foreground">Previsão de entrega: 2 dias</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <Calendar className="h-5 w-5 text-primary mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-foreground">Agendamento confirmado</p>
                        <p className="text-muted-foreground">Amanhã às 14h00</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Por que escolher o Uplink?</h2>
            <p className="text-xl text-muted-foreground">Simples, rápido e sem complicação</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-elegant">
              <CardHeader>
                <Zap className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Configuração Rápida</CardTitle>
                <CardDescription>API pronta em minutos. Crie sua sessão e comece a usar imediatamente.</CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-elegant">
              <CardHeader>
                <Shield className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Sem Burocracia</CardTitle>
                <CardDescription>Não precisa ser BSP do WhatsApp. Acesso direto e simplificado.</CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-elegant">
              <CardHeader>
                <Clock className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Preço Acessível</CardTitle>
                <CardDescription>Apenas R$ 69,90/mês por sessão. Sem taxas escondidas ou surpresas.</CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-elegant">
              <CardHeader>
                <MessageSquare className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Notificações Automáticas</CardTitle>
                <CardDescription>Ideal para avisos de pedidos, confirmações e atualizações de status.</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section id="como-funciona" className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Como funciona?</h2>
            <p className="text-xl text-muted-foreground">3 passos simples para começar</p>
          </div>

          <div className="space-y-8">
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-foreground mb-2">Crie sua conta e faça login</h3>
                <p className="text-muted-foreground text-lg">Cadastro rápido em menos de 1 minuto. Acesse o painel de controle.</p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-foreground mb-2">Crie sua sessão</h3>
                <p className="text-muted-foreground text-lg">Dentro do painel, crie uma nova sessão de API com um clique.</p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-foreground mb-2">Use os dados da API</h3>
                <p className="text-muted-foreground text-lg">Copie as credenciais e integre com seu sistema, chatbot ou automação.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Preços */}
      <section id="precos" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Plano simples e transparente</h2>
            <p className="text-xl text-muted-foreground">Sem complicação, sem taxas escondidas</p>
          </div>

          <Card className="max-w-lg mx-auto border-2 border-primary shadow-elegant">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-3xl">Sessão API WhatsApp</CardTitle>
              <div className="mt-4">
                <span className="text-5xl font-bold text-primary">R$ 69,90</span>
                <span className="text-muted-foreground text-xl">/mês</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary" />
                  <span className="text-foreground">1 sessão de API WhatsApp</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary" />
                  <span className="text-foreground">Configuração em minutos</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary" />
                  <span className="text-foreground">Documentação completa</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary" />
                  <span className="text-foreground">Suporte técnico</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary" />
                  <span className="text-foreground">Sem taxa de adesão</span>
                </div>
              </div>

              <Button 
                onClick={() => navigate("/checkout")} 
                className="w-full h-14 text-lg mt-6 shadow-elegant hover:shadow-glow transition-all"
              >
                Contratar agora
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Cancele quando quiser, sem multa
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Casos de Uso */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Casos de uso reais</h2>
            <p className="text-xl text-muted-foreground">Veja como sua empresa pode usar o Uplink</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-2 hover:border-primary/50 transition-all">
              <CardHeader>
                <div className="flex items-center gap-3 mb-4">
                  <ShoppingCart className="h-8 w-8 text-primary" />
                  <CardTitle>E-commerce</CardTitle>
                </div>
                <CardDescription className="text-base space-y-2">
                  <p>✓ "Seu pedido foi confirmado!"</p>
                  <p>✓ "Pagamento aprovado"</p>
                  <p>✓ "Seu produto está a caminho"</p>
                  <p>✓ "Entrega realizada com sucesso"</p>
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all">
              <CardHeader>
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="h-8 w-8 text-primary" />
                  <CardTitle>Agendamentos</CardTitle>
                </div>
                <CardDescription className="text-base space-y-2">
                  <p>✓ "Seu agendamento foi confirmado"</p>
                  <p>✓ "Lembrete: consulta amanhã"</p>
                  <p>✓ "Horário disponível para reagendamento"</p>
                  <p>✓ "Obrigado pela visita!"</p>
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all">
              <CardHeader>
                <div className="flex items-center gap-3 mb-4">
                  <Package className="h-8 w-8 text-primary" />
                  <CardTitle>Logística</CardTitle>
                </div>
                <CardDescription className="text-base space-y-2">
                  <p>✓ "Pacote saiu para entrega"</p>
                  <p>✓ "Chegou no centro de distribuição"</p>
                  <p>✓ "Tentativa de entrega realizada"</p>
                  <p>✓ "Disponível para retirada"</p>
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all">
              <CardHeader>
                <div className="flex items-center gap-3 mb-4">
                  <MessageSquare className="h-8 w-8 text-primary" />
                  <CardTitle>Automações</CardTitle>
                </div>
                <CardDescription className="text-base space-y-2">
                  <p>✓ Integração com CRM e sistemas</p>
                  <p>✓ Notificações de eventos importantes</p>
                  <p>✓ Alertas de pagamento e cobranças</p>
                  <p>✓ Confirmações automáticas</p>
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">O que dizem nossos clientes</h2>
            <p className="text-xl text-muted-foreground">Empresas que já automatizaram sua comunicação</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Depoimento 1 - E-commerce */}
            <Card className="border-2 hover:shadow-lg transition-all">
              <CardContent className="pt-6">
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className="text-primary text-xl">★</span>
                  ))}
                </div>
                <p className="text-muted-foreground italic mb-4 text-sm leading-relaxed">
                  "Integramos a Uplink em nosso sistema de pedidos e reduzimos em 70% o tempo de resposta aos clientes. A configuração foi surpreendentemente simples e o suporte foi impecável."
                </p>
                <div className="border-t pt-4">
                  <p className="text-sm font-semibold text-foreground">Ricardo Mendes</p>
                  <p className="text-xs text-muted-foreground">CEO - ShopFast E-commerce</p>
                </div>
              </CardContent>
            </Card>

            {/* Depoimento 2 - Clínica */}
            <Card className="border-2 hover:shadow-lg transition-all">
              <CardContent className="pt-6">
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className="text-primary text-xl">★</span>
                  ))}
                </div>
                <p className="text-muted-foreground italic mb-4 text-sm leading-relaxed">
                  "Os lembretes automáticos de consulta diminuíram 85% das faltas. Nossos pacientes adoram receber confirmações pelo WhatsApp. Vale cada centavo!"
                </p>
                <div className="border-t pt-4">
                  <p className="text-sm font-semibold text-foreground">Dra. Amanda Silva</p>
                  <p className="text-xs text-muted-foreground">Coordenadora - Clínica Vida Saudável</p>
                </div>
              </CardContent>
            </Card>

            {/* Depoimento 3 - Logística */}
            <Card className="border-2 hover:shadow-lg transition-all">
              <CardContent className="pt-6">
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className="text-primary text-xl">★</span>
                  ))}
                </div>
                <p className="text-muted-foreground italic mb-4 text-sm leading-relaxed">
                  "Automatizamos todas as notificações de rastreamento. Nossos clientes agora recebem atualizações em tempo real, o que melhorou drasticamente nossa avaliação no Reclame Aqui."
                </p>
                <div className="border-t pt-4">
                  <p className="text-sm font-semibold text-foreground">Paulo Santos</p>
                  <p className="text-xs text-muted-foreground">Diretor - LogExpress Transportes</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Perguntas frequentes</h2>
            <p className="text-xl text-muted-foreground">Tire suas dúvidas sobre o Uplink</p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="border-2 rounded-lg px-6">
              <AccordionTrigger className="text-lg font-semibold text-foreground hover:text-primary">
                Preciso ser BSP do WhatsApp?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Não! O Uplink oferece acesso direto à API sem necessidade de aprovação como Business Solution Provider. Você cria sua sessão e já pode começar a usar.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border-2 rounded-lg px-6">
              <AccordionTrigger className="text-lg font-semibold text-foreground hover:text-primary">
                Posso integrar com automações e sistemas?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Sim! Nossa API é compatível com qualquer sistema que faça requisições HTTP. Você pode integrar com CRMs, chatbots, plataformas de e-commerce, sistemas personalizados e muito mais.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border-2 rounded-lg px-6">
              <AccordionTrigger className="text-lg font-semibold text-foreground hover:text-primary">
                Há limite de mensagens?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                O plano mensal de R$ 69,90 inclui uso normal da sessão. Para volumes muito grandes, entre em contato para planos personalizados.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border-2 rounded-lg px-6">
              <AccordionTrigger className="text-lg font-semibold text-foreground hover:text-primary">
                Quanto tempo leva para configurar?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                A configuração é extremamente rápida! Após criar sua conta, você cria a sessão em 1 clique e recebe os dados da API imediatamente. Em poucos minutos você já está enviando mensagens.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="border-2 rounded-lg px-6">
              <AccordionTrigger className="text-lg font-semibold text-foreground hover:text-primary">
                Posso cancelar quando quiser?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Sim! Não há fidelidade nem multa por cancelamento. Você pode cancelar sua assinatura a qualquer momento direto no painel.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="border-2 rounded-lg px-6">
              <AccordionTrigger className="text-lg font-semibold text-foreground hover:text-primary">
                Vocês oferecem suporte?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Sim! Oferecemos suporte técnico via e-mail e documentação completa para ajudar você a integrar a API com seu sistema.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary via-primary to-secondary text-primary-foreground">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Pronto para automatizar o WhatsApp?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Comece hoje mesmo e transforme a comunicação da sua empresa
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate("/checkout")}
              size="lg"
              variant="secondary"
              className="text-lg h-14 px-8 shadow-xl hover:shadow-2xl transition-all"
            >
              Começar agora
            </Button>
            <Button 
              onClick={() => scrollToSection("precos")}
              size="lg"
              variant="outline"
              className="text-lg h-14 px-8 bg-transparent border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
            >
              Ver preços
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-card border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold text-foreground">Uplink</span>
              </div>
              <p className="text-sm text-muted-foreground">
                API WhatsApp simplificada para sua empresa
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-4">Produto</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => scrollToSection("como-funciona")} className="hover:text-primary transition-colors">Como funciona</button></li>
                <li><button onClick={() => scrollToSection("precos")} className="hover:text-primary transition-colors">Preços</button></li>
                <li><button onClick={() => scrollToSection("faq")} className="hover:text-primary transition-colors">FAQ</button></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-4">Contato</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <a 
                    href="https://wa.me/5541995472941?text=Olá!%20Vim%20pelo%20site%20da%20Uplink%20e%20gostaria%20de%20saber%20mais." 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group"
                  >
                    <MessageSquare className="h-4 w-4 group-hover:scale-110 transition-transform" />
                    <span>(41) 99547-2941</span>
                  </a>
                </li>
                <li>
                  <a 
                    href="mailto:contato@upevolution.com.br"
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group"
                  >
                    <svg className="h-4 w-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="break-all">contato@upevolution.com.br</span>
                  </a>
                </li>
                <li>
                  <p className="text-xs text-muted-foreground italic pt-2">
                    Horário de atendimento:<br/>
                    Seg-Sex: 9h às 18h
                  </p>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Termos de uso</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Política de privacidade</a></li>
                <li><button onClick={() => navigate("/login")} className="hover:text-primary transition-colors">Login</button></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>© 2024 Uplink - Upevolution / Panda INC. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
