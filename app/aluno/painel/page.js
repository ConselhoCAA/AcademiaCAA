'use client';
import { useEffect,useState } from 'react';
import { getSupabaseBrowserClient } from '../../../lib/supabase';
import PixPayment from './PixPayment';

const COURSE='capelania-crista';
const statusLabel={pending:'Aguardando pagamento',paid:'Pagamento confirmado',active:'Curso ativo',completed:'Concluído',cancelled:'Cancelado',refunded:'Reembolsado'};
const money=v=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format((v||0)/100);
export default function Painel(){
 const [user,setUser]=useState(null); const [items,setItems]=useState([]); const [loading,setLoading]=useState(true); const [error,setError]=useState('');
 useEffect(()=>{(async()=>{try{const supabase=getSupabaseBrowserClient();const {data:u,error:userError}=await supabase.auth.getUser();if(userError)throw userError;if(!u.user){window.location.href='/aluno';return;}setUser(u.user);
  let result=await supabase.from('enrollments').select('id,status,enrolled_at,courses(id,slug,title,price_cents,starts_at,modality)').order('enrolled_at',{ascending:false});
  if(result.error)throw result.error;
  let data=result.data||[];
  if(data.length===0){
   const courseSlug=localStorage.getItem('academia_caa_pending_course')||COURSE;
   const enrolled=await supabase.rpc('create_enrollment',{course_slug:courseSlug});
   if(enrolled.error)throw new Error(`Falha ao criar matrícula: ${enrolled.error.message}`);
   localStorage.removeItem('academia_caa_pending_course');
   result=await supabase.from('enrollments').select('id,status,enrolled_at,courses(id,slug,title,price_cents,starts_at,modality)').order('enrolled_at',{ascending:false});
   if(result.error)throw result.error;
   data=result.data||[];
  }
  setItems(data);
 }catch(err){setError(err?.message||'Não foi possível carregar sua matrícula.');}finally{setLoading(false);}})();},[]);
 async function sair(){const supabase=getSupabaseBrowserClient();await supabase.auth.signOut();window.location.href='/aluno';}
 if(loading)return <main><section className="section"><p>Carregando sua Área do Aluno...</p></section></main>;
 return <main><header className="header"><a className="brand" href="/"><b>ACADEMIA CAA</b><span>Formação para Transformar Nações</span></a><nav><a href="/">Início</a><button className="linkButton" onClick={sair}>Sair</button></nav></header><section className="section"><p className="gold">ÁREA DO ALUNO</p><h1>Olá, {user?.user_metadata?.full_name||'aluno'}.</h1><p>Acompanhe suas matrículas, pagamentos e liberações.</p>{error&&<div className="summary"><b>Não foi possível concluir sua matrícula.</b><span>{error}</span><button className="button" onClick={()=>window.location.reload()}>Tentar novamente</button></div>}{!error&&items.length===0&&<div className="summary"><b>Nenhuma matrícula encontrada</b><span>Escolha um curso da Academia CAA para começar.</span><a className="button" href="/#cursos">Ver cursos</a></div>}<div className="grid">{items.map(item=>{const c=item.courses;return <article key={item.id}><p className="gold">{statusLabel[item.status]||item.status}</p><h3>{c?.title||'Curso'}</h3><p>{c?.starts_at?new Date(c.starts_at).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}):''}{c?.modality?` • ${c.modality}`:''}</p><strong>{money(c?.price_cents)}</strong>{item.status==='pending'&&<PixPayment enrollmentId={item.id}/>} {['paid','active','completed'].includes(item.status)&&<p>Pagamento confirmado. Os conteúdos liberados aparecerão nesta área.</p>}</article>})}</div><div className="grid"><article><h3>Materiais</h3><p>Conteúdos serão exibidos conforme a liberação da matrícula.</p></article><article><h3>Certificados</h3><p>Disponíveis após o cumprimento dos requisitos da formação.</p></article></div></section></main>;
}
