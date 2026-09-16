'use client';
import { useEffect,useState } from 'react';
import { getSupabaseBrowserClient } from '../../../lib/supabase';

export default function Painel(){
 const [user,setUser]=useState(null); const [loading,setLoading]=useState(true);
 useEffect(()=>{const supabase=getSupabaseBrowserClient(); supabase.auth.getUser().then(({data})=>{if(!data.user){window.location.href='/aluno';return;} setUser(data.user);setLoading(false);});},[]);
 async function sair(){const supabase=getSupabaseBrowserClient();await supabase.auth.signOut();window.location.href='/aluno';}
 if(loading)return <main><section className="section"><p>Carregando sua Área do Aluno...</p></section></main>;
 return <main><header className="header"><a className="brand" href="/"><b>ACADEMIA CAA</b><span>Formação para Transformar Nações</span></a><nav><a href="/">Início</a><button className="linkButton" onClick={sair}>Sair</button></nav></header><section className="section"><p className="gold">ÁREA DO ALUNO</p><h1>Olá, {user?.user_metadata?.full_name||'aluno'}.</h1><p>Sua conta está ativa. Aqui serão exibidos seus cursos, materiais, avisos e certificados conforme a situação de cada matrícula.</p><div className="grid"><article><h3>Meus cursos</h3><p>Suas matrículas aparecerão aqui após a vinculação ao curso.</p></article><article><h3>Pagamentos</h3><p>O próximo passo será integrar o PIX e a confirmação automática.</p></article><article><h3>Certificados</h3><p>Disponíveis após o cumprimento dos requisitos da formação.</p></article></div></section></main>;
}
