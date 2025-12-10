import { useState, useEffect } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, BarChart, Bar, Radar, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, ScatterChart, Scatter, LineChart, Line, Legend
} from 'recharts';
import { ArrowLeft, Trophy, Activity, Dumbbell, TrendingUp, BarChart2, Layers } from 'lucide-react';
import { format, parseISO, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import type { UserSession } from '../types';

interface TrackingProps {
  session: UserSession;
  onBack: () => void;
}

// Cores para diferenciar os meses no gráfico aranha
const MONTH_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function Tracking({ session, onBack }: TrackingProps) {
  // --- DADOS GERAIS ---
  const [totalVolume, setTotalVolume] = useState(0);
  const [totalTreinos, setTotalTreinos] = useState(0);
  const [volumeSemanal, setVolumeSemanal] = useState<any[]>([]);
  const [intensidadeMedia, setIntensidadeMedia] = useState<any[]>([]);
  
  // --- DADOS RADAR (COMPARATIVO) ---
  const [dadosRadar, setDadosRadar] = useState<any[]>([]);
  const [mesesDisponiveis, setMesesDisponiveis] = useState<string[]>([]);
  const [mesesSelecionados, setMesesSelecionados] = useState<string[]>([]);
  
  // --- DADOS ESPECÍFICOS ---
  const [exerciciosLista, setExerciciosLista] = useState<{id:string, nome:string}[]>([]);
  const [exercicioSelecionado, setExercicioSelecionado] = useState<string>('');
  const [evolucaoCarga, setEvolucaoCarga] = useState<any[]>([]);
  const [dispersaoRepxCarga, setDispersaoRepxCarga] = useState<any[]>([]);

  // 1. BUSCAR E PROCESSAR TUDO
  useEffect(() => {
    async function fetchGeral() {
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
        .order('data_sessao', { ascending: true });

      if (!sessoes) return;

      let volTotalVida = 0;
      const mapSemana = new Map();
      const mapIntensidade = new Map();
      const mapExercicios = new Map();
      
      // Estruturas para o Radar (Mês -> Músculo -> Contagem)
      const radarMap: Record<string, Record<string, number>> = {};
      const mesesSet = new Set<string>();

      sessoes.forEach(s => {
        const dataIso = parseISO(s.data_sessao);
        const semanaKey = format(startOfWeek(dataIso), 'dd/MMM', { locale: ptBR });
        const mesKey = format(dataIso, 'MMM/yy', { locale: ptBR });
        
        mesesSet.add(mesKey);

        let volDia = 0;
        let repsDia = 0;

        s.series_log.forEach((log: any) => {
          const carga = Number(log.carga_kg) || 0;
          const reps = Number(log.repeticoes_executadas) || 0;
          const musculo = log.exercicios_normalizados?.grupo_muscular || 'Geral';
          
          const volSerie = carga * reps;
          volDia += volSerie;
          repsDia += reps;
          volTotalVida += volSerie;

          // Popula Radar (Séries por Músculo por Mês)
          if (!radarMap[musculo]) radarMap[musculo] = {};
          if (!radarMap[musculo][mesKey]) radarMap[musculo][mesKey] = 0;
          radarMap[musculo][mesKey] += 1; // Conta +1 série

          // Lista de Exercícios
          if (log.exercicios_normalizados?.id) {
            mapExercicios.set(log.exercicios_normalizados.id, log.exercicios_normalizados.nome);
          }
        });

        // Volume Semanal
        mapSemana.set(semanaKey, (mapSemana.get(semanaKey) || 0) + volDia);

        // Intensidade
        if (repsDia > 0) {
          const intensidade = Math.round(volDia / repsDia);
          mapIntensidade.set(semanaKey, intensidade);
        }
      });

      // --- FINALIZA RADAR ---
      const mesesArray = Array.from(mesesSet);
      const dadosRadarFinal = Object.keys(radarMap).map(musculo => {
        const entry: any = { subject: musculo, fullMark: 100 }; // fullMark é só referência
        mesesArray.forEach(m => {
          entry[m] = radarMap[musculo][m] || 0;
        });
        return entry;
      });

      // Estados Gerais
      setTotalVolume(volTotalVida);
      setTotalTreinos(sessoes.length);
      setVolumeSemanal(Array.from(mapSemana, ([name, vol]) => ({ name, vol })));
      setIntensidadeMedia(Array.from(mapIntensidade, ([name, int]) => ({ name, int })));
      
      // Estados Radar
      setDadosRadar(dadosRadarFinal);
      setMesesDisponiveis(mesesArray);
      setMesesSelecionados(mesesArray.slice(-2)); // Seleciona os 2 últimos por padrão

      // Estados Específicos
      const listaEx = Array.from(mapExercicios, ([id, nome]) => ({ id, nome }));
      setExerciciosLista(listaEx);
      if (listaEx.length > 0 && !exercicioSelecionado) setExercicioSelecionado(listaEx[0].id);
    }
    fetchGeral();
  }, [session.clientId]);

  // 2. BUSCAR DADOS ESPECÍFICOS
  useEffect(() => {
    if (!exercicioSelecionado) return;

    async function fetchEspecifico() {
      const { data } = await supabase!
        .from('series_log')
        .select(`carga_kg, repeticoes_executadas, sessao_treino!inner(data_sessao)`)
        .eq('sessao_treino.cliente_id', session.clientId)
        .eq('exercicio_id', exercicioSelecionado)
        .order('sessao_treino(data_sessao)', { ascending: true });

      if (data) {
        const mapEvolucao = new Map();
        const arrayDispersao: any[] = [];

        data.forEach((log: any) => {
          const dataFormatada = format(parseISO(log.sessao_treino.data_sessao), 'dd/MM');
          const carga = Number(log.carga_kg);
          const reps = Number(log.repeticoes_executadas);

          if (!mapEvolucao.has(dataFormatada) || carga > mapEvolucao.get(dataFormatada)) {
            mapEvolucao.set(dataFormatada, carga);
          }
          arrayDispersao.push({ x: carga, y: reps, z: 1 });
        });

        setEvolucaoCarga(Array.from(mapEvolucao, ([data, carga]) => ({ data, carga })));
        setDispersaoRepxCarga(arrayDispersao);
      }
    }
    fetchEspecifico();
  }, [exercicioSelecionado]);

  // Helper Radar
  const toggleMes = (mes: string) => {
    if (mesesSelecionados.includes(mes)) {
      setMesesSelecionados(mesesSelecionados.filter(m => m !== mes));
    } else {
      if (mesesSelecionados.length >= 3) return alert("Selecione no máximo 3 meses para comparar.");
      setMesesSelecionados([...mesesSelecionados, mes]);
    }
  };

  const formatPeso = (val: number) => val > 1000 ? `${(val/1000).toFixed(1)}t` : `${val}kg`;

  return (
    <div className="app-container">
      <header className="header">
        <button onClick={onBack} className="btn-secondary" style={{width:'auto', display:'flex', gap:5}}>
          <ArrowLeft size={18} /> Voltar
        </button>
        <div className="logo">Analytics</div>
        <div style={{width: 80}}></div>
      </header>

      <div className="main" style={{flexDirection: 'column', padding: '1.5rem', overflowY: 'auto', gap: '2rem'}}>
        
        {/* 1. PERFORMANCE GERAL */}
        <section>
          <h3 className="section-title">Performance Geral</h3>
          <div className="stats-grid">
            <div className="stat-card highlight">
              <div className="icon-box"><Dumbbell size={24} color="#3b82f6" /></div>
              <div><p>Volume Total</p><h3>{formatPeso(totalVolume)}</h3></div>
            </div>
            <div className="stat-card">
              <div className="icon-box"><Trophy size={24} color="#fbbf24" /></div>
              <div><p>Treinos Realizados</p><h3>{totalTreinos}</h3></div>
            </div>
          </div>
        </section>

        {/* 2. VOLUME E INTENSIDADE */}
        <section className="charts-grid-2">
          <div className="chart-card">
            <div className="chart-header"><BarChart2 size={18} className="text-primary"/><h4>Volume Semanal</h4></div>
            <div style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer>
                <BarChart data={volumeSemanal}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{fontSize:10}} />
                  <Tooltip cursor={{fill: '#334155', opacity: 0.4}} contentStyle={{backgroundColor: '#1e293b', border: '1px solid #334155'}} />
                  <Bar dataKey="vol" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Volume (kg)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-header"><Activity size={18} className="text-primary"/><h4>Intensidade Média</h4></div>
            <div style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer>
                <LineChart data={intensidadeMedia}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{fontSize:10}} />
                  <YAxis stroke="#94a3b8" tick={{fontSize:10}} domain={['dataMin - 5', 'auto']} />
                  <Tooltip contentStyle={{backgroundColor: '#1e293b', border: '1px solid #334155'}} />
                  <Line type="monotone" dataKey="int" stroke="#f59e0b" strokeWidth={2} dot={{r:4}} name="Média (kg)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* 3. DISTRIBUIÇÃO MUSCULAR (COMPARATIVO) */}
        <section>
          <div className="chart-card full-width">
            <div className="chart-header-control">
              <div className="title-group"><Layers size={18} className="text-primary"/><h4>Comparativo Muscular</h4></div>
              
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

            <div style={{ width: '100%', height: 350 }}>
              <ResponsiveContainer>
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={dadosRadar}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 'bold' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                  
                  {mesesSelecionados.map((mes, index) => (
                    <Radar
                      key={mes}
                      name={mes}
                      dataKey={mes}
                      stroke={MONTH_COLORS[index % MONTH_COLORS.length]}
                      strokeWidth={3}
                      fill={MONTH_COLORS[index % MONTH_COLORS.length]}
                      fillOpacity={0.3}
                    />
                  ))}
                  
                  <Tooltip contentStyle={{backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px'}} itemStyle={{color:'#fff'}} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
              {mesesSelecionados.length === 0 && <p className="no-data" style={{textAlign:'center', marginTop:-180}}>Selecione meses acima</p>}
            </div>
          </div>
        </section>

        {/* 4. ANÁLISE POR EXERCÍCIO */}
        <section>
          <div className="section-header-row">
            <h3 className="section-title">Análise Detalhada</h3>
            <select className="chart-select" value={exercicioSelecionado} onChange={e => setExercicioSelecionado(e.target.value)}>
              {exerciciosLista.map(ex => <option key={ex.id} value={ex.id}>{ex.nome}</option>)}
            </select>
          </div>

          <div className="charts-grid-2">
            <div className="chart-card">
              <div className="chart-header"><TrendingUp size={18} className="text-primary"/><h4>Evolução de Carga</h4></div>
              <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                  <AreaChart data={evolucaoCarga}>
                    <defs><linearGradient id="colEvo" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="data" stroke="#94a3b8" tick={{fontSize:10}} />
                    <YAxis stroke="#94a3b8" tick={{fontSize:10}} domain={['dataMin - 5', 'auto']} />
                    <Tooltip contentStyle={{backgroundColor: '#1e293b', border: '1px solid #334155'}} />
                    <Area type="monotone" dataKey="carga" stroke="#3b82f6" fill="url(#colEvo)" name="Máx (kg)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-header"><Activity size={18} className="text-primary"/><h4>Peso x Repetições</h4></div>
              <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" dataKey="x" name="Carga" unit="kg" stroke="#94a3b8" tick={{fontSize:10}} />
                    <YAxis type="number" dataKey="y" name="Reps" stroke="#94a3b8" tick={{fontSize:10}} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{backgroundColor: '#1e293b', border: '1px solid #334155'}} />
                    <Scatter name="Séries" data={dispersaoRepxCarga} fill="#ef4444" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}