import { useState, useEffect } from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, Radar, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, LineChart, Line, Legend
} from 'recharts';
import { 
  ArrowLeft, Activity, BarChart2, Calendar as CalendarIcon, 
  ChevronDown, ChevronLeft, ChevronRight, Layers, Trophy 
} from 'lucide-react';
import { 
  format, parseISO, subDays, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, eachDayOfInterval, addMonths, 
  subMonths, isSameMonth, isSameDay 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import type { UserSession, PeriodFilter } from '../types';

interface TrackingProps {
  session: UserSession;
  onBack: () => void;
}

const MONTH_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function Tracking({ session, onBack }: TrackingProps) {
  const [periodoFiltro, setPeriodoFiltro] = useState<PeriodFilter>('personalizado'); 
  const [diasPeriodo, setDiasPeriodo] = useState(180); 
  const [showDropdown, setShowDropdown] = useState(false);

  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [cargaMedia, setCargaMedia] = useState(0);
  const [volumeTotalPeriodo, setVolumeTotalPeriodo] = useState(0);
  const [intensidadeMedia, setIntensidadeMedia] = useState(0);
  const [gruposMusculares, setGruposMusculares] = useState(0);

  const [volumeSemanal, setVolumeSemanal] = useState<any[]>([]);
  const [intensidadeData, setIntensidadeData] = useState<any[]>([]);
  const [dadosRadar, setDadosRadar] = useState<any[]>([]);
  const [mesesDisponiveis, setMesesDisponiveis] = useState<string[]>([]);
  const [mesesSelecionados, setMesesSelecionados] = useState<string[]>([]);

  const [heatmapData, setHeatmapData] = useState<Record<string, number>>({});
  const [personalRecords, setPersonalRecords] = useState<{nome: string, carga: number, data: string}[]>([]);

  const [exerciciosLista, setExerciciosLista] = useState<{id:string, nome:string}[]>([]);
  const [exercicioSelecionado, setExercicioSelecionado] = useState<string>('');
  const [evolucaoCarga, setEvolucaoCarga] = useState<any[]>([]);

  const periodos = [
    { value: 'dia', label: 'Dia', dias: 1 },
    { value: 'semana', label: 'Semana', dias: 7 },
    { value: 'mes', label: 'Mês', dias: 30 },
    { value: 'ano', label: 'Ano', dias: 365 },
    { value: 'personalizado', label: 'Personalizado', dias: 180 },
  ];

  // Helpers
  const normalize = (val: number) => Number(val.toFixed(2));
  const formatVolume = (val: number) => val >= 1000 ? `${(val/1000).toFixed(2)}t` : `${Math.round(val)}kg`;

  useEffect(() => {
    const periodo = periodos.find(p => p.value === periodoFiltro);
    if (periodo) setDiasPeriodo(periodo.dias);
  }, [periodoFiltro]);

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

      if (!sessoes || sessoes.length === 0) {
        setCargaMedia(0); setVolumeTotalPeriodo(0); setIntensidadeMedia(0);
        setVolumeSemanal([]); setIntensidadeData([]); setDadosRadar([]);
        setHeatmapData({}); setPersonalRecords([]);
        return;
      }

      const mapSemana = new Map();
      const mapIntensidade = new Map();
      const mapExercicios = new Map();
      const radarMapMensal: Record<string, Record<string, number>> = {};
      const mesesSet = new Set<string>();
      
      const mapHeatmap: Record<string, number> = {};
      const mapPRs = new Map<string, {carga: number, data: string, nome: string}>();

      let somatorioCargaGeral = 0;
      let countSeriesGeral = 0;
      let somatorioIntensidadeGeral = 0;
      let diasComTreino = 0;
      let volumeTotalAcumulado = 0;

      sessoes.forEach(s => {
        const dataIso = parseISO(s.data_sessao);
        const dataKeyYMD = format(dataIso, 'yyyy-MM-dd'); 
        const diaKey = format(dataIso, 'EEE', { locale: ptBR }).charAt(0).toUpperCase(); 
        const mesKey = format(dataIso, 'MMM', { locale: ptBR }); 
        const mesPretty = mesKey.charAt(0).toUpperCase() + mesKey.slice(1);
        
        mesesSet.add(mesPretty);

        let volDia = 0;
        let repsDia = 0;
        let setsDia = 0;
        
        s.series_log.forEach((log: any) => {
          const carga = Number(log.carga_kg) || 0;
          const reps = Number(log.repeticoes_executadas) || 0;
          const musculo = log.exercicios_normalizados?.grupo_muscular || 'Geral';
          const exId = log.exercicios_normalizados?.id;
          const exNome = log.exercicios_normalizados?.nome;

          const volSerie = normalize(carga * reps);
          volDia += volSerie;
          repsDia += reps;
          setsDia += 1;
          somatorioCargaGeral += carga;
          countSeriesGeral += 1;

          if (!radarMapMensal[musculo]) radarMapMensal[musculo] = {};
          if (!radarMapMensal[musculo][mesPretty]) radarMapMensal[musculo][mesPretty] = 0;
          radarMapMensal[musculo][mesPretty] += 1;

          if (exId && exNome) {
            mapExercicios.set(exId, exNome);
            const recordeAtual = mapPRs.get(exId);
            if (!recordeAtual || carga > recordeAtual.carga) {
              mapPRs.set(exId, { carga: carga, data: format(dataIso, 'dd/MM'), nome: exNome });
            }
          }
        });

        volumeTotalAcumulado += volDia;
        mapSemana.set(diaKey, normalize((mapSemana.get(diaKey) || 0) + volDia));

        const nivelEsforco = setsDia > 15 ? 4 : setsDia > 10 ? 3 : setsDia > 5 ? 2 : 1;
        
        if (!mapHeatmap[dataKeyYMD] || nivelEsforco > mapHeatmap[dataKeyYMD]) {
          mapHeatmap[dataKeyYMD] = nivelEsforco;
        }

        if (repsDia > 0) {
          const intensidade = normalize(volDia / repsDia);
          mapIntensidade.set(diaKey, intensidade);
          somatorioIntensidadeGeral += intensidade;
          diasComTreino += 1;
        }
      });

      const mediaCargaFinal = countSeriesGeral > 0 ? normalize(somatorioCargaGeral / countSeriesGeral) : 0;
      const mediaIntensidadeFinal = diasComTreino > 0 ? normalize(somatorioIntensidadeGeral / diasComTreino) : 0;
      
      setCargaMedia(mediaCargaFinal);
      setVolumeTotalPeriodo(normalize(volumeTotalAcumulado));
      setIntensidadeMedia(mediaIntensidadeFinal);
      setGruposMusculares(Object.keys(radarMapMensal).length);
      setHeatmapData(mapHeatmap);

      const topPRs = Array.from(mapPRs.values()).sort((a, b) => b.carga - a.carga).slice(0, 6);
      setPersonalRecords(topPRs);

      const diasOrdem = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
      setVolumeSemanal(diasOrdem.map(dia => ({ name: dia, vol: mapSemana.get(dia) || 0 })));
      setIntensidadeData(diasOrdem.map(dia => ({ name: dia, int: mapIntensidade.get(dia) || 0 })));

      const listaMeses = Array.from(mesesSet);
      const dadosRadarFinal = Object.keys(radarMapMensal).map(musculo => {
        const entry: any = { subject: musculo, fullMark: 100 };
        listaMeses.forEach(m => {
          entry[m] = radarMapMensal[musculo][m] || 0;
        });
        return entry;
      });

      setMesesDisponiveis(listaMeses);
      if (listaMeses.length > 0) setMesesSelecionados(listaMeses.slice(-2));
      setDadosRadar(dadosRadarFinal);

      const listaEx = Array.from(mapExercicios, ([id, nome]) => ({ id, nome }));
      setExerciciosLista(listaEx);
      if (listaEx.length > 0 && !exercicioSelecionado) setExercicioSelecionado(listaEx[0].id);
    }

    if (session.clientId) fetchGeral();
  }, [session.clientId, diasPeriodo]);

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
            mapEvolucao.set(dataFormatada, normalize(carga));
          }
        });
        setEvolucaoCarga(Array.from(mapEvolucao, ([data, carga]) => ({ data, carga })));
      }
    }
    fetchEspecifico();
  }, [exercicioSelecionado, diasPeriodo, session.clientId]);

  // Helpers Radar
  const toggleMes = (mes: string) => {
    if (mesesSelecionados.includes(mes)) {
      setMesesSelecionados(mesesSelecionados.filter(m => m !== mes));
    } else {
      if (mesesSelecionados.length >= 3) return alert("Selecione no máximo 3 meses.");
      setMesesSelecionados([...mesesSelecionados, mes]);
    }
  };

  // Helpers Calendário
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  
  const generateCalendarDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart); // Domingo
    const endDate = endOfWeek(monthEnd);
    
    return eachDayOfInterval({ start: startDate, end: endDate });
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
        <div style={{width: 40}}></div>
      </header>

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
              {[30, 90, 180, 365].map(d => (
                <button key={d} onClick={() => { setDiasPeriodo(d); setPeriodoFiltro('personalizado'); setShowDropdown(false); }}>
                  {d} dias
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="content-scroll">
        
        {/* KPI CARDS */}
        <section className="performance-section">
          <h3 className="section-title">Performance Geral</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon blue"><div className="icon-bars"></div></div>
              <div className="stat-content">
                <h2 className="stat-value">{cargaMedia} <span style={{fontSize:'0.9rem'}}>kg</span></h2>
                <p className="stat-label">Carga média / série</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon blue"><BarChart2 size={24} /></div>
              <div className="stat-content">
                <h2 className="stat-value">{formatVolume(volumeTotalPeriodo)}</h2>
                <p className="stat-label">Volume total</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon blue"><Activity size={24} /></div>
              <div className="stat-content">
                <h2 className="stat-value">{intensidadeMedia} <span style={{fontSize:'0.9rem'}}>kg</span></h2>
                <p className="stat-label">Intensidade média</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-content full">
                <h2 className="stat-value">{gruposMusculares}</h2>
                <p className="stat-label">grupos treinados</p>
              </div>
            </div>
          </div>
        </section>

        {/* --- CALENDÁRIO MENSAL (CONSISTÊNCIA) --- */}
        <section className="chart-section">
          <div className="chart-header-with-select" style={{marginBottom: '1rem'}}>
             <div style={{display:'flex', alignItems:'center', gap:8}}>
               <CalendarIcon size={18} className="text-primary"/>
               <h4 className="chart-title" style={{borderLeft:'none', paddingLeft:0}}>Calendário de Treinos</h4>
             </div>
             
             {/* Navegação do Calendário */}
             <div className="calendar-nav">
               <button onClick={prevMonth} className="nav-btn"><ChevronLeft size={20}/></button>
               <span className="month-label">
                 {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
               </span>
               <button onClick={nextMonth} className="nav-btn"><ChevronRight size={20}/></button>
             </div>
          </div>

          <div className="calendar-wrapper">
            <div className="calendar-grid">
              {/* Dias da Semana */}
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                <div key={i} className="calendar-weekday">{d}</div>
              ))}
              
              {/* Dias do Mês */}
              {generateCalendarDays().map((day) => {
                const dayKey = format(day, 'yyyy-MM-dd');
                const intensidade = heatmapData[dayKey] || 0;
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isToday = isSameDay(day, new Date());

                return (
                  <div 
                    key={dayKey} 
                    className={`calendar-day 
                      ${!isCurrentMonth ? 'other-month' : ''} 
                      ${intensidade > 0 ? `level-${intensidade}` : ''}
                      ${isToday ? 'today' : ''}
                    `}
                  >
                    <span>{format(day, 'd')}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* EVOLUÇÃO DE CARGA */}
        <section className="chart-section">
          <div className="chart-header-with-select">
            <h4 className="chart-title">Evolução de Carga</h4>
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
                <Tooltip 
                  contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px'}} 
                  labelStyle={{color: '#94a3b8'}}
                  formatter={(value: number) => [`${value} kg`, 'Carga']}
                />
                <Line type="monotone" dataKey="carga" stroke="#3b82f6" strokeWidth={3} dot={{r:3, fill:'#3b82f6'}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* GRID DUPLO */}
        <div className="dual-chart-grid">
          <section className="chart-section">
            <h4 className="chart-title">Volume Semanal</h4>
            <div className="chart-container small">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeSemanal}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" tick={{fontSize:11, fill:'#64748b'}} />
                  <Tooltip 
                    contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px'}} 
                    labelStyle={{color: '#94a3b8'}} cursor={{fill: '#1e293b', opacity: 0.5}}
                    formatter={(value: number) => [`${value} kg`, 'Volume']}
                  />
                  <Bar dataKey="vol" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="chart-section">
            <h4 className="chart-title">Intensidade Média</h4>
            <div className="chart-container small">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={intensidadeData}>
                  <defs><linearGradient id="colorInt" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" tick={{fontSize:11, fill:'#64748b'}} />
                  <YAxis stroke="#64748b" tick={{fontSize:11, fill:'#64748b'}} domain={['auto', 'auto']} />
                  <Tooltip 
                    contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px'}} 
                    labelStyle={{color: '#94a3b8'}}
                    formatter={(value: number) => [`${value} kg`, 'Média']}
                  />
                  <Area type="monotone" dataKey="int" stroke="#3b82f6" strokeWidth={2} fill="url(#colorInt)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        {/* RADAR COMPARAÇÃO */}
        <section className="chart-section">
          <div className="chart-header-with-select" style={{justifyContent: 'flex-start', gap: '1rem'}}>
            <div style={{display:'flex', alignItems:'center', gap:8}}>
               <Layers size={18} className="text-primary"/>
               <h4 className="chart-title" style={{borderLeft:'none', paddingLeft:0}}>Comparativo Muscular</h4>
            </div>
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
                
                <Tooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px'}} itemStyle={{color: '#fff'}} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
            {mesesSelecionados.length === 0 && <p style={{textAlign: 'center', color: '#64748b', fontSize: '0.8rem', marginTop: -20}}>Selecione meses acima para comparar</p>}
          </div>
        </section>

        {/* RECORDES PESSOAIS */}
        <section className="chart-section">
          <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:'1rem'}}>
             <Trophy size={18} color="#fbbf24"/>
             <h4 className="chart-title" style={{borderLeft:'none', paddingLeft:0}}>Recordes (PRs)</h4>
          </div>
          <div className="pr-grid">
            {personalRecords.map((pr, idx) => (
              <div key={idx} className="pr-card">
                <div className="pr-rank">#{idx + 1}</div>
                <div className="pr-info">
                  <span className="pr-name">{pr.nome}</span>
                  <span className="pr-date">{pr.data}</span>
                </div>
                <div className="pr-value">{pr.carga} <small>kg</small></div>
              </div>
            ))}
          </div>
          {personalRecords.length === 0 && <p className="no-data">Sem recordes no período.</p>}
        </section>

      </div>
    </div>
  );
}