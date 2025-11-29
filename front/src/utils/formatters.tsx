export const formatarDescricao = (texto: string) => {
  if (!texto) return "Sem descrição disponível.";
  
  return texto.split(/\\n|\n/).map((linha, index) => {
    const linhaLimpa = linha.trim();
    if (!linhaLimpa) return null;
    
    const ehNumeroDoPasso = /^(\d+)\.?$/.test(linhaLimpa);
    
    if (ehNumeroDoPasso) {
      return <h5 key={index} className="step-number">PASSO {linhaLimpa.replace('.', '')}</h5>;
    }
    return <p key={index} className="step-text">{linhaLimpa}</p>;
  });
};