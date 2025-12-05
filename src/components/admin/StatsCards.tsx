import { Shield, AlertTriangle, Clock, CheckCircle } from 'lucide-react';

interface StatsCardsProps {
  total: number;
  pendentes: number;
  vulneraveis: number;
  seguros: number;
}

export function StatsCards({ total, pendentes, vulneraveis, seguros }: StatsCardsProps) {
  const stats = [
    {
      label: 'Total',
      value: total,
      icon: Shield,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Pendentes',
      value: pendentes,
      icon: Clock,
      color: 'text-warning',
      bg: 'bg-warning/10',
    },
    {
      label: 'Vulneráveis',
      value: vulneraveis,
      icon: AlertTriangle,
      color: 'text-destructive',
      bg: 'bg-destructive/10',
    },
    {
      label: 'Seguros',
      value: seguros,
      icon: CheckCircle,
      color: 'text-accent',
      bg: 'bg-accent/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`glass rounded-xl p-4 ${stat.label === 'Vulneráveis' && vulneraveis > 0 ? 'glow-pulse border border-destructive/50' : ''}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground font-rajdhani">
              {stat.label}
            </span>
            <div className={`p-2 rounded-lg ${stat.bg}`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
          </div>
          <p className={`font-orbitron text-3xl ${stat.color}`}>
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}
