import { useState, useEffect, useRef } from 'react';
import { Dumbbell, Plus, Search, Trash2, ChevronRight, Info, PlayCircle, X, GripVertical } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatarDescricao } from '../utils/formatters';
import type { UserSession, Exercicio, Rotina, ItemRotina } from '../types.ts';

import { HowToUse } from './HowToUse.tsx';
import { HelpCircle } from 'lucide-react'; 

interface DashboardProps {
  session: UserSession;
  onLogout: () => void;
}

export function Dashboard({ session, onLogout }: DashboardProps) {
  // --- ESTADOS ---
  const [exercicios, setExercicios] = useState<Exercicio[]>([]);
  const [rotinas, setRotinas] = useState<Rotina[]>([]);
  const [itensRotina, setItensRotina] = useState<ItemRotina[]>([]);
  
  const [rotinaSelecionada, setRotinaSelecionada] = useState<string | null>(null);
  const [termoBusca, setTermoBusca] = useState('');
  const [filtroGrupo, setFiltroGrupo] = useState<string | null>(null);

  // Modais
  const [modalAddOpen, setModalAddOpen] = useState(false);
  const [modalDetalhesOpen, setModalDetalhesOpen] = useState(false);
  const [exercicioSelecionado, setExercicioSelecionado] = useState<Exercicio | null>(null);
  const [formTreino, setFormTreino] = useState({ series: '3', reps: '12', descanso: '60s' });
  const [modalNovaRotinaOpen, setModalNovaRotinaOpen] = useState(false);
  const [nomeNovaRotina, setNomeNovaRotina] = useState('');

  // Navegação
  const [showHowToUse, setShowHowToUse] = useState(false);

// --- REF PARA DRAG AND DROP ---
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // --- BUSCAR DADOS ---
  useEffect(() => {
    if (!supabase) return;
    async function fetchDados() {
      // Exercícios (Públicos)
      const { data: exData } = await supabase!.from('exercicios_normalizados').select('*');
      if (exData) setExercicios(exData);

      // Rotinas (Filtradas pelo Cliente)
      const { data: rotData } = await supabase!
        .from('rotinas_treino')
        .select('*')
        .eq('cliente_id', session.clientId);
      if (rotData) setRotinas(rotData);
    }
    fetchDados();
  }, [session.clientId]);

  // Buscar Itens da Rotina Selecionada
  useEffect(() => {
    if (!supabase || !rotinaSelecionada) return;
    async function fetchItens() {
      const { data } = await supabase!
        .from('exercicios_rotina')
        .select(`*, exercicios_normalizados (*)`)
        .eq('rotina_id', rotinaSelecionada)
        .order('ordem');
      
      if (data) {
        const itensFormatados = data.map((item: any) => ({
          ...item,
          exercicio_detalhes: item.exercicios_normalizados
        }));
        setItensRotina(itensFormatados);
      }
    }
    fetchItens();
  }, [rotinaSelecionada]);

  const handleSort = async () => {
    // 1. Cria uma cópia da lista atual
    let _itensRotina = [...itensRotina];

    // 2. Remove o item arrastado e insere na nova posição
    if (dragItem.current === null || dragOverItem.current === null) return;
    
    const draggedItemContent = _itensRotina.splice(dragItem.current, 1)[0];
    _itensRotina.splice(dragOverItem.current, 0, draggedItemContent);

    // 3. Reseta os refs
    dragItem.current = null;
    dragOverItem.current = null;

    // 4. Atualiza o estado visualmente (Optimistic UI)
    setItensRotina(_itensRotina);

    // 5. Salva no Supabase (Atualiza a ordem de todos)
    // Dica: Para listas pequenas (<50 itens), atualizar tudo é mais seguro e fácil
    if(!supabase) return;

    const updates = _itensRotina.map((item, index) => ({
      id: item.id,
      ordem: index.toString(),
    }));

    // Promise.all para enviar todas as atualizações em paralelo
    await Promise.all(updates.map(u => 
      supabase!.from('exercicios_rotina').update({ ordem: u.ordem }).eq('id', u.id)
    ));
  };

  // --- AÇÕES DO SISTEMA ---
  const criarRotina = async () => {
    if (!supabase || !nomeNovaRotina) return;
    const { data } = await supabase.from('rotinas_treino')
      .insert([{ titulo: nomeNovaRotina, cliente_id: session.clientId }])
      .select();
    if (data) {
      setRotinas([...rotinas, data[0]]);
      setModalNovaRotinaOpen(false);
      setNomeNovaRotina('');
    }
  };

  const adicionarExercicio = async () => {
    if (!supabase || !exercicioSelecionado || !rotinaSelecionada) return;
    const { data } = await supabase.from('exercicios_rotina').insert([{
        rotina_id: rotinaSelecionada,
        exercicio_id: exercicioSelecionado.id,
        qtd_series: formTreino.series,
        qtd_repeticoes: formTreino.reps,
        tempo_descanso: formTreino.descanso,
        ordem: (itensRotina.length + 1).toString()
      }]).select();

    if (data) {
      const novoItem = { ...data[0], exercicio_detalhes: exercicioSelecionado };
      setItensRotina([...itensRotina, novoItem]);
      setModalAddOpen(false);
    }
  };

  const removerItem = async (id: string) => {
    if (!supabase) return;
    await supabase.from('exercicios_rotina').delete().eq('id', id);
    setItensRotina(itensRotina.filter(i => i.id !== id));
  };

  // --- FILTROS ---
  const gruposMusculares = Array.from(new Set(exercicios.map(ex => ex.grupo_muscular))).sort();
  const exerciciosFiltrados = exercicios.filter(ex => {
    const matchBusca = ex.nome.toLowerCase().includes(termoBusca.toLowerCase());
    const matchGrupo = filtroGrupo ? ex.grupo_muscular === filtroGrupo : true;
    return matchBusca && matchGrupo;
  });

  const abrirDetalhes = (ex: Exercicio) => { setExercicioSelecionado(ex); setModalDetalhesOpen(true); };
  const abrirAdicionar = (ex: Exercicio) => {
    if(!rotinaSelecionada) return alert("Selecione uma rotina primeiro!");
    setExercicioSelecionado(ex);
    setModalAddOpen(true);
  };

  if (showHowToUse) {
  return <HowToUse onBack={() => setShowHowToUse(false)} />;
  }

  return (
    <div className="app-container">
      {/* HEADER */}
      <header className="header">
  <div className="logo"><Dumbbell className="text-primary" /> Rap<span>mind</span></div>
  <div style={{display:'flex', alignItems:'center', gap:'1rem'}}>

    {/* BOTÃO DE AJUDA */}
    <button 
      className="btn-icon" 
      onClick={() => setShowHowToUse(true)} 
      title="Como usar o Agente"
      style={{color: 'var(--text-muted)', background: 'transparent'}}
    >
      <HelpCircle size={20} />
    </button>

    <div className="user-badge">{session.nome || session.email}</div>
    <button className="btn-logout" onClick={onLogout} title="Sair"><X size={16}/></button>
  </div>
</header>

      <div className="main">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <span>Minhas Rotinas</span>
            <button onClick={() => setModalNovaRotinaOpen(true)} className="btn-icon-add"><Plus size={20}/></button>
          </div>
          <div className="rotinas-list">
            {rotinas.map(rot => (
              <div key={rot.id} className={`rotina-item ${rotinaSelecionada === rot.id ? 'active' : ''}`} onClick={() => setRotinaSelecionada(rot.id)}>
                <span className="truncate">{rot.titulo}</span> {rotinaSelecionada === rot.id && <ChevronRight size={16} />}
              </div>
            ))}
          </div>
        </aside>

        {/* CATALOGO */}
        <section className="catalog">
          <div className="catalog-header">
            <div className="search-wrapper">
              <Search className="search-icon" size={18} />
              <input className="search-bar" placeholder="Buscar exercício..." value={termoBusca} onChange={e => setTermoBusca(e.target.value)} />
            </div>
            <div className="filters-container">
              <button className={`filter-chip ${filtroGrupo === null ? 'active' : ''}`} onClick={() => setFiltroGrupo(null)}>Todos</button>
              {gruposMusculares.map(grupo => (
                <button key={grupo} className={`filter-chip ${filtroGrupo === grupo ? 'active' : ''}`} onClick={() => setFiltroGrupo(grupo)}>{grupo}</button>
              ))}
            </div>
          </div>
          <div className="exercises-grid">
            {exerciciosFiltrados.map(ex => (
              <div key={ex.id} className="exercise-card">
                <div className="card-header">
                  <span className="badge">{ex.grupo_muscular}</span>
                  <button className="btn-info" onClick={() => abrirDetalhes(ex)}><Info size={18} /></button>
                </div>
                <h3>{ex.nome}</h3>
                <button className="btn-add-card" onClick={() => abrirAdicionar(ex)}><Plus size={16} /> Adicionar</button>
              </div>
            ))}
          </div>
        </section>

        {/* PAINEL DIREITO: DETALHES DA ROTINA */}
        {rotinaSelecionada && (
          <aside className="routine-details">
            <div className="routine-header">
              <div className="rh-title">
                <h3>{rotinas.find(r => r.id === rotinaSelecionada)?.titulo}</h3>
                <span className="routine-count">{itensRotina.length} exercícios</span>
              </div>
              
              {/* BOTÃO DE FECHAR O PAINEL */}
              <button 
                className="btn-close-panel" 
                onClick={() => setRotinaSelecionada(null)} 
                title="Fechar painel"
              >
                <X size={20} />
              </button>
            </div>

            <div className="routine-items-list">
              {itensRotina.map((item, index) => (
                <div 
                  key={item.id} 
                  className="routine-item-card draggable"
                  draggable
                  onDragStart={() => (dragItem.current = index)}
                  onDragEnter={() => (dragOverItem.current = index)}
                  onDragEnd={handleSort}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <div className="ric-header">
                    <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
                      {/* Ícone de Grip para indicar que pode arrastar */}
                      <GripVertical size={16} className="grip-icon" />
                      <strong>{item.exercicio_detalhes?.nome}</strong>
                    </div>
                    <button className="btn-delete" onClick={() => removerItem(item.id)}><Trash2 size={16} /></button>
                  </div>
                  <div className="ric-specs">
                    <span>{item.qtd_series} x {item.qtd_repeticoes}</span><span>⏱ {item.tempo_descanso}</span>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>

      {/* --- MODAIS --- */}
      {/* 1. Modal Configuração Série */}
      {modalAddOpen && (
        <div className="overlay">
          <div className="modal">
            <div className="modal-header"><h3>Configurar</h3><button className="btn-close" onClick={() => setModalAddOpen(false)}><X size={20}/></button></div>
            <div className="form-grid">
              <div className="form-group"><label>Séries</label><input value={formTreino.series} onChange={e => setFormTreino({...formTreino, series: e.target.value})} /></div>
              <div className="form-group"><label>Reps</label><input value={formTreino.reps} onChange={e => setFormTreino({...formTreino, reps: e.target.value})} /></div>
              <div className="form-group"><label>Descanso</label><input value={formTreino.descanso} onChange={e => setFormTreino({...formTreino, descanso: e.target.value})} /></div>
            </div>
            <div className="modal-actions"><button className="btn-primary full" onClick={adicionarExercicio}>Salvar</button></div>
          </div>
        </div>
      )}

      {/* 2. Modal Detalhes/Video */}
      {modalDetalhesOpen && exercicioSelecionado && (
        <div className="overlay" onClick={() => setModalDetalhesOpen(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="flex-col"><span className="badge-lg">{exercicioSelecionado.grupo_muscular}</span><h3>{exercicioSelecionado.nome}</h3></div>
              <button className="btn-close" onClick={() => setModalDetalhesOpen(false)}><X size={24}/></button>
            </div>
            <div className="modal-body">
              {exercicioSelecionado.link_video ? (
                <div className="video-wrapper"><iframe src={exercicioSelecionado.link_video.replace("watch?v=", "embed/")} title="Video" frameBorder="0" allowFullScreen></iframe></div>
              ) : (
                <div className="video-placeholder"><PlayCircle size={48} opacity={0.5} /><p>Sem vídeo</p></div>
              )}
              <div className="description-box">
                <h4>Execução</h4>
                <div className="steps-container">{formatarDescricao(exercicioSelecionado.descricao)}</div>
              </div>
            </div>
            <div className="modal-actions">
               <button className="btn-primary full" onClick={() => { setModalDetalhesOpen(false); abrirAdicionar(exercicioSelecionado); }}>Adicionar à Rotina</button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal Nova Rotina */}
      {modalNovaRotinaOpen && (
        <div className="overlay">
          <div className="modal">
            <h3>Nova Rotina</h3>
            <div className="form-group"><label>Nome</label><input autoFocus value={nomeNovaRotina} onChange={e => setNomeNovaRotina(e.target.value)} /></div>
            <div className="modal-actions">
               <button className="btn-secondary" onClick={() => setModalNovaRotinaOpen(false)}>Cancelar</button>
               <button className="btn-primary" onClick={criarRotina}>Criar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}