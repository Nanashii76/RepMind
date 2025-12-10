export interface UserSession { 
  token: string; 
  clientId: string;
  clientName: string; 
  email: string; 
  nome?: string; 
}

export interface Exercicio { 
  id: string; 
  nome: string; 
  grupo_muscular: string; 
  descricao: string; 
  link_video?: string; 
}

export interface Rotina { 
  id: string; 
  titulo: string; 
  cliente_id: string; 
}

export interface ItemRotina {
  id: string; 
  rotina_id: string; 
  exercicio_id: string; 
  ordem: string;
  qtd_series: string; 
  qtd_repeticoes: string; 
  tempo_descanso: string; 
  observacoes: string;
  exercicios_normalizados?: Exercicio;
  exercicio_detalhes?: Exercicio; // Helper para o frontend
}

export type PeriodFilter = 'dia' | 'semana' | 'mes' | 'ano' | 'personalizado';