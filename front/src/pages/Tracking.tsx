import { useState, useEffect } from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, Radar, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, LineChart, Line, Legend
} from 'recharts';
import { ArrowLeft, Activity, BarChart2, Calendar, ChevronDown } from 'lucide-react';
import { format, parseISO, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import type { UserSession, PeriodFilter } from '../types';

interface TrackingProps {
  session: UserSession;
  onBack: () => void;
}

// Cores para os meses no gráfico aranha
const MONTH_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function Tracking({ session, onBack }: TrackingProps) {
  const [periodoFiltro, setPeriodoFiltro] = useState<PeriodFilter>('semana');
  const [diasPeriodo, setDiasPeriodo] = useState(90);
  const [showDropdown, setShowDropdown] = useState(false);

  // Estados dos Cards
  const [cargaMediaPercent, setCargaMediaPercent] = useState(0);
  const [volumeSemanalPercent, setVolumeSemanalPercent] = useState(0);
  const [intensidadePercent, setIntensidadePercent] = useState(0);
  const [gruposMusculares, setGruposMusculares] = useState(0);

  // Estados dos Gráficos
  const [volumeSemanal, setVolumeSemanal] = useState<any[]>([]);
  const [intensidadeData, setIntensidadeData] = useState<any[]>([]);
  
  // --- NOVO: Estados para o Radar Comparativo ---
  const [dadosRadar, setDadosRadar] = useState<any[]>([]);
  const [mesesDisponiveis, setMesesDisponiveis] = useState<string[]>([]);
  const [mesesSelecionados, setMesesSelecionados] = useState<string[]>([]);

  // Estados Específicos
  const [exerciciosLista, setExerciciosLista] = useState<{id:string, nome:string}[]>([]);
  const [exercicioSelecionado, setExercicioSelecionado] = useState<string>('');
  const [evolucaoCarga, setEvolucaoCarga] = useState<any[]>([]);

  const periodos = [
    { value: 'dia', label: 'Dia', dias: 1 },
    { value: 'semana', label: 'Semana', dias: 7 },
    { value: 'mes', label: 'Mês', dias: 30 },
    { value: 'ano', label: 'Ano', dias: 365 },
    { value: 'personalizado', label: 'Personalizado', dias: 90 },
  ];

  useEffect(() => {
    const periodo = periodos.find(p => p.value === periodoFiltro);
    if (periodo) setDiasPeriodo(periodo.dias);
  }, [periodoFiltro]);

  // BUSCA DADOS GERAIS
  useEffect(() => {
    async function fetchGeral() {
      const dataInicio = format(subDays(new Date(), diasPeriodo), 'yyyy-MM-dd');

      const { data: sessoes } = await supabase!
        .from('sessao_treino')
        .select(`
          data_sessao,
          series_log (
            repeticoes_executadas, carga_kg,
            exercicios_normalizados (grupo_muscular, id, nome)
          )
        `)
        .eq('cliente_id', session.clientId)
        .gte('data_sessao', dataInicio)
        .order('data_sessao', { ascending: true });

      if (!sessoes || sessoes.length === 0) return;

      const mapSemana = new Map();
      const mapIntensidade = new Map();
      const mapExercicios = new Map();
      
      // Estrutura para o Radar: { "Peito": { "Jan": 5, "Fev": 8 }, ... }
      const radarMapMensal: Record<string, Record<string, number>> = {};
      const mesesSet = new Set<string>();

      let totalCarga = 0;
      let totalSeries = 0;
      let somatorioIntensidade = 0;
      let diasComTreino = 0;

      sessoes.forEach(s => {
        const dataIso = parseISO(s.data_sessao);
        const diaKey = format(dataIso, 'EEE', { locale: ptBR }).charAt(0).toUpperCase();
        // Chave do Mês para o Radar (ex: "Jan", "Fev")
        const mesKey = format(dataIso, 'MMM', { locale: ptBR }).charAt(0).toUpperCase() + format(dataIso, 'MMM', { locale: ptBR }).slice(1);
        mesesSet.add(mesKey);

        let volDia = 0;
        let repsDia = 0;
        let cargaDia = 0;

        s.series_log.forEach((log: any) => {
          const carga = Number(log.carga_kg) || 0;
          const reps = Number(log.repeticoes_executadas) || 0;
          const musculo = log.exercicios_normalizados?.grupo_muscular || 'Geral';

          const volSerie = carga * reps;
          volDia += volSerie;
          repsDia += reps;
          cargaDia += carga;
          totalSeries += 1;

          // Popula Radar por Mês
          if (!radarMapMensal[musculo]) radarMapMensal[musculo] = {};
          if (!radarMapMensal[musculo][mesKey]) radarMapMensal[musculo][mesKey] = 0;
          radarMapMensal[musculo][mesKey] += 1; // Contagem de séries

          if (log.exercicios_normalizados?.id) {
            mapExercicios.set(log.exercicios_normalizados.id, log.exercicios_normalizados.nome);
          }
        });

        totalCarga += cargaDia;
        mapSemana.set(diaKey, (mapSemana.get(diaKey) || 0) + volDia);

        if (repsDia > 0) {
          const intensidade = Math.round(volDia / repsDia);
          mapIntensidade.set(diaKey, intensidade);
          somatorioIntensidade += intensidade;
          diasComTreino += 1;
        }
      });

      // --- Processamento dos Cards ---
      const cargaMedia = totalSeries > 0 ? totalCarga / totalSeries : 0;
      const volumeTotal = Array.from(mapSemana.values()).reduce((a, b) => a + b, 0);
      const intensidadeMedia = diasComTreino > 0 ? somatorioIntensidade / diasComTreino : 0;
      
      setCargaMediaPercent(Math.round((cargaMedia / 100) * 100));
      setVolumeSemanalPercent(Math.round((volumeTotal / 10000) * 100));
      setIntensidadePercent(Math.round((intensidadeMedia / 100) * 100));
      setGruposMusculares(Object.keys(radarMapMensal).length);

      // --- Processamento Gráficos Lineares ---
      const diasOrdem = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
      setVolumeSemanal(diasOrdem.map(dia => ({ name: dia, vol: mapSemana.get(dia) || 0 })));
      setIntensidadeData(diasOrdem.map(dia => ({ name: dia, int: mapIntensidade.get(dia) || 0 })));

      // --- Processamento Radar (Comparativo) ---
      const listaMeses = Array.from(mesesSet);
      const dadosRadarFinal = Object.keys(radarMapMensal).map(musculo => {
        const entry: any = { subject: musculo, fullMark: 100 };
        listaMeses.forEach(m => {
          entry[m] = radarMapMensal[musculo][m] || 0;
        });
        return entry;
      });

      setMesesDisponiveis(listaMeses);
      // Seleciona por padrão o último mês (ou os 2 últimos se houver)
      if (listaMeses.length > 0) {
        setMesesSelecionados(listaMeses.slice(-2)); 
      }
      setDadosRadar(dadosRadarFinal);

      // Dropdown de Exercícios
      const listaEx = Array.from(mapExercicios, ([id, nome]) => ({ id, nome }));
      setExerciciosLista(listaEx);
      if (listaEx.length > 0 && !exercicioSelecionado) setExercicioSelecionado(listaEx[0].id);
    }

    if (session.clientId) fetchGeral();
  }, [session.clientId, diasPeriodo]);

  // BUSCA DADOS ESPECÍFICOS
  useEffect(() => {
    if (!exercicioSelecionado) return;

    async function fetchEspecifico() {
      const dataInicio = format(subDays(new Date(), diasPeriodo), 'yyyy-MM-dd');
      const { data } = await supabase!
        .from('series_log')
        .select(`carga_kg, sessao_treino!inner(data_sessao, cliente_id)`)
        .eq('sessao_treino.cliente_id', session.clientId)
        .eq('exercicio_id', exercicioSelecionado)
        .gte('sessao_treino.data_sessao', dataInicio)
        .order('sessao_treino(data_sessao)', { ascending: true });

      if (data) {
        const mapEvolucao = new Map();
        data.forEach((log: any) => {
          const dataFormatada = format(parseISO(log.sessao_treino.data_sessao), 'dd/MM');
          const carga = Number(log.carga_kg);
          if (!mapEvolucao.has(dataFormatada) || carga > mapEvolucao.get(dataFormatada)) {
            mapEvolucao.set(dataFormatada, carga);
          }
        });
        setEvolucaoCarga(Array.from(mapEvolucao, ([data, carga]) => ({ data, carga })));
      }
    }
    fetchEspecifico();
  }, [exercicioSelecionado, diasPeriodo, session.clientId]);

  // Toggle para o gráfico de Radar
  const toggleMes = (mes: string) => {
    if (mesesSelecionados.includes(mes)) {
      setMesesSelecionados(mesesSelecionados.filter(m => m !== mes));
    } else {
      if (mesesSelecionados.length >= 3) {
        alert("Selecione no máximo 3 meses para comparar.");
        return;
      }
      setMesesSelecionados([...mesesSelecionados, mes]);
    }
  };

  return (
    <div className="tracking-container">
      <header className="tracking-header">
        <button onClick={onBack} className="back-button">
          <ArrowLeft size={20} />
        </button>
        <div className="header-center">
          <h1 className="header-title">Sua Evolução</h1>
          <p className="header-subtitle">Últimos {diasPeriodo} dias</p>
        </div>
        <button className="calendar-button"><Calendar size={24} /></button>
      </header>

      {/* Filtros de Período */}
      <div className="period-filters">
        {periodos.filter(p => p.value !== 'personalizado').map(periodo => (
          <button
            key={periodo.value}
            className={`period-tab ${periodoFiltro === periodo.value ? 'active' : ''}`}
            onClick={() => setPeriodoFiltro(periodo.value as PeriodFilter)}
          >
            {periodo.label}
          </button>
        ))}
        <div className="dropdown-container">
          <button
            className={`period-tab ${periodoFiltro === 'personalizado' ? 'active' : ''}`}
            onClick={() => setShowDropdown(!showDropdown)}
          >
            Personalizado <ChevronDown size={16} />
          </button>
          {showDropdown && (
            <div className="dropdown-menu">
              {[30, 60, 90, 180].map(d => (
                <button key={d} onClick={() => { setDiasPeriodo(d); setPeriodoFiltro('personalizado'); setShowDropdown(false); }}>
                  {d} dias
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="content-scroll">
        <section className="performance-section">
          <h3 className="section-title">Performance Geral</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon blue"><div className="icon-bars"></div></div>
              <div className="stat-content"><h2 className="stat-value">{cargaMediaPercent}%</h2><p className="stat-label">Carga média</p></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon blue"><BarChart2 size={24} /></div>
              <div className="stat-content"><h2 className="stat-value">{volumeSemanalPercent}%</h2><p className="stat-label">Volume semanal</p></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon blue"><Activity size={24} /></div>
              <div className="stat-content"><h2 className="stat-value">{intensidadePercent}%</h2><p className="stat-label">Intensidade</p></div>
            </div>
            <div className="stat-card">
              <div className="stat-content full"><h2 className="stat-value">{gruposMusculares}</h2><p className="stat-label">grupos musculares</p></div>
            </div>
          </div>
        </section>

        {/* GRÁFICOS DE LINHA */}
        <section className="chart-section">
          <div className="chart-header-with-select">
            <h4 className="chart-title">Carga por exercício</h4>
            <select className="exercise-select" value={exercicioSelecionado} onChange={e => setExercicioSelecionado(e.target.value)}>
              {exerciciosLista.map(ex => <option key={ex.id} value={ex.id}>{ex.nome}</option>)}
            </select>
          </div>
          <div className="chart-container small">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolucaoCarga}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="data" stroke="#64748b" tick={{fontSize:11, fill:'#64748b'}} />
                <YAxis stroke="#64748b" tick={{fontSize:11, fill:'#64748b'}} domain={['auto', 'auto']} />
                <Tooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px'}} labelStyle={{color: '#94a3b8'}} />
                <Line type="monotone" dataKey="carga" stroke="#3b82f6" strokeWidth={3} dot={{r:3, fill:'#3b82f6'}} name="Carga (kg)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* GRÁFICOS DE BARRAS E ÁREA */}
        <div className="dual-chart-grid">
          <section className="chart-section">
            <h4 className="chart-title">Volume semanal</h4>
            <div className="chart-container small">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeSemanal}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" tick={{fontSize:11, fill:'#64748b'}} />
                  <Tooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px'}} labelStyle={{color: '#94a3b8'}} cursor={{fill: '#1e293b', opacity: 0.5}} />
                  <Bar dataKey="vol" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="chart-section">
            <h4 className="chart-title">Intensidade</h4>
            <div className="chart-container small">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={intensidadeData}>
                  <defs><linearGradient id="colorInt" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" tick={{fontSize:11, fill:'#64748b'}} />
                  <YAxis stroke="#64748b" tick={{fontSize:11, fill:'#64748b'}} domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px'}} labelStyle={{color: '#94a3b8'}} />
                  <Area type="monotone" dataKey="int" stroke="#3b82f6" strokeWidth={2} fill="url(#colorInt)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        {/* --- GRÁFICO DE RADAR COM COMPARAÇÃO --- */}
        <section className="chart-section">
          <div className="chart-header-with-select" style={{justifyContent: 'flex-start', gap: '1rem'}}>
            <h4 className="chart-title">Comparativo Muscular</h4>
            {/* Seletor de Meses */}
            <div className="month-selector">
              {mesesDisponiveis.map(mes => (
                <button 
                  key={mes}
                  className={`month-chip ${mesesSelecionados.includes(mes) ? 'active' : ''}`}
                  onClick={() => toggleMes(mes)}
                >
                  {mes}
                </button>
              ))}
            </div>
          </div>

          <div className="chart-container small" style={{height: 350}}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="65%" data={dadosRadar}>
                <PolarGrid stroke="#1e293b" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                
                {/* Renderiza um Radar para cada mês selecionado */}
                {mesesSelecionados.map((mes, index) => (
                  <Radar
                    key={mes}
                    name={mes}
                    dataKey={mes}
                    stroke={MONTH_COLORS[index % MONTH_COLORS.length]}
                    strokeWidth={2}
                    fill={MONTH_COLORS[index % MONTH_COLORS.length]}
                    fillOpacity={0.3}
                  />
                ))}
                
                <Tooltip 
                  contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px'}}
                  itemStyle={{color: '#fff'}}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
            {mesesSelecionados.length === 0 && <p style={{textAlign: 'center', color: '#64748b', fontSize: '0.8rem', marginTop: -20}}>Selecione meses acima para comparar</p>}
          </div>
        </section>

      </div>
    </div>
  );
}