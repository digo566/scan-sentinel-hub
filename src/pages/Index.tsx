import { CyberScene } from '@/components/3d/CyberScene';
import { SubmissionForm } from '@/components/forms/SubmissionForm';
import { VulnerabilityShowcase } from '@/components/sections/VulnerabilityShowcase';
import { Shield, Lock, Eye, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Index = () => {
  return (
    <div className="bg-background relative">
      {/* Fixed 3D Background */}
      <div className="fixed inset-0 z-0">
        <CyberScene />
      </div>
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-20 p-6">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary" />
            <span className="font-orbitron text-xl text-foreground neon-text">
              SecScan
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/auth">
              <Button
                variant="outline"
                className="border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground"
              >
                <Lock className="w-4 h-4 mr-2" />
                Área do Cliente
              </Button>
            </Link>
            <Link to="/admin">
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-primary"
              >
                Admin
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 min-h-screen flex items-center">
        <div className="container mx-auto px-6 py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Hero Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <span className="text-sm text-muted-foreground font-rajdhani">
                  Proteção Cibernética Avançada
                </span>
              </div>
              
              <h1 className="font-orbitron text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                <span className="text-glow">Proteja</span> sua{' '}
                <span className="text-secondary">Aplicação</span>{' '}
                contra{' '}
                <span className="text-destructive">Ameaças</span>
              </h1>
              
              <p className="text-lg text-muted-foreground mb-8 font-rajdhani max-w-xl">
                Nossa equipe especializada analisa sua aplicação em busca de vulnerabilidades 
                de segurança. Receba um relatório completo e proteção proativa.
              </p>

              {/* Features */}
              <div className="grid sm:grid-cols-3 gap-4 mb-8">
                <div className="glass rounded-lg p-4 text-center">
                  <Eye className="w-6 h-6 text-primary mx-auto mb-2" />
                  <span className="text-sm text-foreground font-rajdhani">
                    Análise Manual
                  </span>
                </div>
                <div className="glass rounded-lg p-4 text-center">
                  <Shield className="w-6 h-6 text-accent mx-auto mb-2" />
                  <span className="text-sm text-foreground font-rajdhani">
                    Equipe Expert
                  </span>
                </div>
                <div className="glass rounded-lg p-4 text-center">
                  <Zap className="w-6 h-6 text-secondary mx-auto mb-2" />
                  <span className="text-sm text-foreground font-rajdhani">
                    Contato Direto
                  </span>
                </div>
              </div>
            </div>

            {/* Right - Form */}
            <div className="lg:pl-8">
              <SubmissionForm />
            </div>
          </div>
        </div>
      </main>

      {/* Vulnerability Showcase Section */}
      <VulnerabilityShowcase />

      {/* Footer */}
      <footer className="relative z-10 p-6 text-center bg-background/80">
        <p className="text-sm text-muted-foreground font-rajdhani">
          © 2024 SecScan - Segurança Cibernética Profissional
        </p>
      </footer>
    </div>
  );
};

export default Index;
