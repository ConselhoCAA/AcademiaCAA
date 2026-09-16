'use client';
import { useState } from 'react';
import { getSupabaseBrowserClient } from '../../lib/supabase';
export default function LoginForm(){
 const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [message,setMessage]=useState(''); const [loading,setLoading]=useState(false);
 async function handleSubmit(event){event.preventDefault();setLoading(true);setMessage('');try{
  const supabase=getSupabaseBrowserClient(); const {error}=await supabase.auth.signInWithPassword({email,password}); if(error)throw error;
  const pending=localStorage.getItem('academia_caa_pending_course');
  if(pending){const {error:enrollError}=await supabase.rpc('create_enrollment',{course_slug:pending});if(!enrollError)localStorage.removeItem('academia_caa_pending_course');}
  window.location.href='/aluno/painel';
 }catch(error){setMessage(error?.message==='Invalid login credentials'?'E-mail ou senha incorretos.':'Não foi possível entrar. Confira seus dados e tente novamente.');}finally{setLoading(false);}}
 return <form className="formCard" onSubmit={handleSubmit}><p className="gold">ENTRAR</p><h2>Acesse sua conta</h2><label>E-mail<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="seuemail@exemplo.com" required autoComplete="email"/></label><label>Senha<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required minLength={6} autoComplete="current-password"/></label><button className="button" type="submit" disabled={loading}>{loading?'Entrando...':'Entrar'}</button>{message&&<p className="safe" role="alert">{message}</p>}<p className="safe">Ainda não possui conta? <a href="/inscricao/capelania-crista">Faça sua inscrição.</a></p></form>;
}
