import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-8 py-8 md:py-16 max-w-4xl">
        {/* Header com Logo */}
        <div className="flex flex-col items-center mb-12">
          <img 
            src="/logo-uplink.png" 
            alt="Uplink Logo" 
            className="h-16 w-16 mb-6 rounded-full shadow-lg"
          />
          <h1 className="text-4xl md:text-5xl font-bold text-foreground text-center mb-2">
            Política de Privacidade – Uplink
          </h1>
          <p className="text-sm text-muted-foreground">
            Última atualização: 25 de novembro de 2025
          </p>
        </div>

        {/* Conteúdo */}
        <div className="space-y-8 text-foreground">
          {/* Introdução */}
          <div className="space-y-4 leading-relaxed">
            <p>
              A <strong>Uplink</strong>, operada pela <strong>Panda42</strong>, controladora empresarial do titular 
              Mario R Schiavon (CNPJ 46.214.207/0001-60), está comprometida com a proteção da privacidade dos 
              seus usuários e com a transparência no tratamento de dados pessoais.
            </p>
            <p>
              Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas 
              informações, em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
            </p>
            <p className="font-medium">
              Ao utilizar a Uplink, você concorda com as práticas descritas nesta política.
            </p>
          </div>

          {/* Seção 1 */}
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-foreground">1. DADOS COLETADOS</h2>
            <p className="leading-relaxed">
              A Uplink coleta apenas os dados mínimos necessários para o funcionamento da plataforma:
            </p>
            <ul className="space-y-2 leading-relaxed list-disc list-inside ml-4">
              <li><strong>E-mail:</strong> Utilizado para autenticação, recuperação de senha e comunicações essenciais sobre o serviço.</li>
              <li><strong>Nome (opcional):</strong> Pode ser fornecido pelo usuário para personalização da conta.</li>
              <li><strong>Dados de uso:</strong> Informações técnicas sobre o uso da API, como volume de mensagens e horários de conexão, para fins operacionais.</li>
            </ul>
            <p className="leading-relaxed font-medium">
              A Uplink NÃO coleta, armazena ou acessa o conteúdo das mensagens enviadas através da API.
            </p>
          </section>

          {/* Seção 2 */}
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-foreground">2. FINALIDADE DO TRATAMENTO</h2>
            <p className="leading-relaxed">
              Os dados coletados são utilizados exclusivamente para:
            </p>
            <ul className="space-y-2 leading-relaxed list-disc list-inside ml-4">
              <li>Criar e gerenciar sua conta de usuário</li>
              <li>Autenticar o acesso à plataforma</li>
              <li>Fornecer suporte técnico e atendimento</li>
              <li>Processar pagamentos e emitir cobranças</li>
              <li>Cumprir obrigações legais e regulatórias</li>
              <li>Melhorar a qualidade e segurança do serviço</li>
            </ul>
          </section>

          {/* Seção 3 */}
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-foreground">3. COMPARTILHAMENTO DE DADOS</h2>
            <p className="leading-relaxed">
              A Uplink não vende, aluga ou compartilha seus dados pessoais com terceiros para fins de marketing.
            </p>
            <p className="leading-relaxed">
              Seus dados podem ser compartilhados apenas nas seguintes situações:
            </p>
            <ul className="space-y-2 leading-relaxed list-disc list-inside ml-4">
              <li><strong>Processadores de pagamento:</strong> Para processar assinaturas e cobranças (Stripe, Mercado Pago).</li>
              <li><strong>Serviços de infraestrutura:</strong> Provedores de hospedagem e banco de dados necessários para operação da plataforma.</li>
              <li><strong>Obrigações legais:</strong> Quando exigido por lei, ordem judicial ou autoridade competente.</li>
            </ul>
            <p className="leading-relaxed">
              Todos os parceiros são cuidadosamente selecionados e comprometidos com a proteção de dados.
            </p>
          </section>

          {/* Seção 4 */}
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-foreground">4. ARMAZENAMENTO E SEGURANÇA</h2>
            <p className="leading-relaxed">
              A Uplink adota medidas técnicas e organizacionais para proteger seus dados contra acesso não autorizado, 
              perda, destruição ou alteração:
            </p>
            <ul className="space-y-2 leading-relaxed list-disc list-inside ml-4">
              <li>Criptografia de dados em trânsito (HTTPS/TLS)</li>
              <li>Controle de acesso restrito a sistemas e informações</li>
              <li>Monitoramento contínuo de segurança</li>
              <li>Backups regulares para prevenção de perda de dados</li>
            </ul>
            <p className="leading-relaxed">
              Os dados são armazenados em servidores seguros e mantidos apenas pelo tempo necessário para 
              cumprimento das finalidades descritas ou conforme exigido por lei.
            </p>
          </section>

          {/* Seção 5 */}
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-foreground">5. RETENÇÃO DE DADOS</h2>
            <p className="leading-relaxed">
              Seus dados pessoais serão mantidos enquanto sua conta estiver ativa ou conforme necessário para 
              fornecer os serviços.
            </p>
            <p className="leading-relaxed">
              Após o encerramento da conta, os dados podem ser mantidos por período adicional para:
            </p>
            <ul className="space-y-2 leading-relaxed list-disc list-inside ml-4">
              <li>Cumprimento de obrigações legais e contratuais</li>
              <li>Resolução de disputas ou questões judiciais</li>
              <li>Prevenção de fraudes e abusos</li>
            </ul>
            <p className="leading-relaxed">
              Dados financeiros e fiscais são mantidos conforme legislação brasileira (mínimo de 5 anos).
            </p>
          </section>

          {/* Seção 6 */}
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-foreground">6. COOKIES E TECNOLOGIAS SIMILARES</h2>
            <p className="leading-relaxed">
              A Uplink <strong>não utiliza cookies de rastreamento ou publicidade</strong>.
            </p>
            <p className="leading-relaxed">
              Utilizamos apenas cookies essenciais para o funcionamento da plataforma, como:
            </p>
            <ul className="space-y-2 leading-relaxed list-disc list-inside ml-4">
              <li>Cookies de sessão para manter você autenticado</li>
              <li>Cookies de segurança para proteção contra ataques</li>
            </ul>
            <p className="leading-relaxed">
              Estes cookies são estritamente necessários e não coletam informações pessoais identificáveis.
            </p>
          </section>

          {/* Seção 7 */}
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-foreground">7. SEUS DIREITOS (LGPD)</h2>
            <p className="leading-relaxed">
              De acordo com a LGPD, você tem os seguintes direitos sobre seus dados pessoais:
            </p>
            <ul className="space-y-2 leading-relaxed list-disc list-inside ml-4">
              <li><strong>Acesso:</strong> Confirmar a existência de tratamento e acessar seus dados</li>
              <li><strong>Correção:</strong> Solicitar correção de dados incompletos, inexatos ou desatualizados</li>
              <li><strong>Anonimização/Bloqueio:</strong> Solicitar anonimização ou bloqueio de dados desnecessários</li>
              <li><strong>Eliminação:</strong> Solicitar exclusão de dados tratados com seu consentimento</li>
              <li><strong>Portabilidade:</strong> Solicitar cópia dos dados em formato estruturado</li>
              <li><strong>Revogação:</strong> Revogar consentimento a qualquer momento</li>
              <li><strong>Oposição:</strong> Opor-se a tratamento realizado com base em interesse legítimo</li>
            </ul>
            <p className="leading-relaxed">
              Para exercer seus direitos, entre em contato através do e-mail: 
              <a href="mailto:contato@upevolution.com.br" className="text-primary hover:underline ml-1">
                contato@upevolution.com.br
              </a>
            </p>
          </section>

          {/* Seção 8 */}
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-foreground">8. PRIVACIDADE DE MENORES</h2>
            <p className="leading-relaxed">
              A Uplink não coleta intencionalmente dados de menores de 18 anos.
            </p>
            <p className="leading-relaxed">
              Se você acredita que um menor forneceu dados pessoais, entre em contato conosco para que 
              possamos removê-los imediatamente.
            </p>
          </section>

          {/* Seção 9 */}
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-foreground">9. TRANSFERÊNCIA INTERNACIONAL DE DADOS</h2>
            <p className="leading-relaxed">
              Seus dados podem ser transferidos e armazenados em servidores localizados fora do Brasil, 
              utilizados por nossos provedores de infraestrutura.
            </p>
            <p className="leading-relaxed">
              Garantimos que estas transferências são realizadas em conformidade com a LGPD e com garantias 
              adequadas de proteção, incluindo cláusulas contratuais padrão e certificações de segurança.
            </p>
          </section>

          {/* Seção 10 */}
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-foreground">10. ALTERAÇÕES NA POLÍTICA</h2>
            <p className="leading-relaxed">
              Esta Política de Privacidade pode ser atualizada periodicamente para refletir mudanças em 
              nossas práticas ou em requisitos legais.
            </p>
            <p className="leading-relaxed">
              Alterações significativas serão comunicadas através do e-mail cadastrado ou por aviso na plataforma.
            </p>
            <p className="leading-relaxed">
              A data de "Última atualização" no topo desta página indica quando a política foi revisada pela última vez.
            </p>
          </section>

          {/* Seção 11 */}
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-foreground">11. RESPONSÁVEL PELO TRATAMENTO</h2>
            <p className="leading-relaxed">
              <strong>Controlador de Dados:</strong>
            </p>
            <ul className="space-y-2 leading-relaxed ml-4">
              <li>Razão Social: Panda42</li>
              <li>Titular: Mario R Schiavon</li>
              <li>CNPJ: 46.214.207/0001-60</li>
              <li>Endereço: Rua Alexandre Foggiatto, Brasil</li>
              <li>E-mail: <a href="mailto:contato@upevolution.com.br" className="text-primary hover:underline">contato@upevolution.com.br</a></li>
            </ul>
          </section>

          {/* Seção 12 */}
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-foreground">12. CONTATO E DÚVIDAS</h2>
            <p className="leading-relaxed">
              Se você tiver dúvidas, preocupações ou solicitações relacionadas a esta Política de Privacidade 
              ou ao tratamento de seus dados pessoais, entre em contato conosco:
            </p>
            <ul className="space-y-2 leading-relaxed ml-4">
              <li>E-mail: <a href="mailto:contato@upevolution.com.br" className="text-primary hover:underline">contato@upevolution.com.br</a></li>
              <li>Responsável: Mario R Schiavon</li>
            </ul>
            <p className="leading-relaxed">
              Responderemos sua solicitação no menor prazo possível e, no máximo, dentro dos prazos 
              estabelecidos pela LGPD.
            </p>
          </section>

          {/* Nota Final */}
          <div className="bg-muted/50 p-6 rounded-lg space-y-3 border border-border">
            <p className="font-semibold text-foreground">Importante:</p>
            <p className="text-sm leading-relaxed">
              A Uplink é uma plataforma de API para WhatsApp e <strong>não tem acesso ao conteúdo das mensagens</strong> 
              enviadas pelos usuários através da API. Não somos responsáveis pelo conteúdo transmitido, 
              que é de inteira responsabilidade do usuário.
            </p>
            <p className="text-sm leading-relaxed">
              O usuário é responsável por garantir que o uso da API esteja em conformidade com a LGPD e 
              demais legislações aplicáveis ao tratamento de dados de seus próprios clientes/usuários finais.
            </p>
          </div>
        </div>

        {/* Botões de Navegação */}
        <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={() => navigate("/login")}
            size="lg"
            className="px-8"
          >
            Voltar ao Login
          </Button>
          <Button 
            onClick={() => navigate("/")}
            variant="outline"
            size="lg"
            className="px-8"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Início
          </Button>
        </div>

        {/* Rodapé */}
        <footer className="mt-16 pt-8 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Uplink – Panda42
          </p>
        </footer>
      </div>
    </div>
  );
}
