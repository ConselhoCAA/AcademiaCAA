'use client';
import { useState } from 'react';
import { getSupabaseBrowserClient } from '../../../lib/supabase';

const COURSE='capelania-crista';
export default function SignupForm(){
 const [msg,setMsg]=useState(''); const [busy,setBusy]=useState(false);
 async function submit(e){
  e.preventDefault(); setBusy(true); setMsg('');
  const f=new FormData(e.currentTarget);
  const email=String(f.get('email')||'').trim(); const password=String(f.get('password')||'');
  const full_name=String(f.get('full_name')||'').trim(); const certificate_name=String(f.get('certificate_name')||'').trim();
  try{
   const supabase=getSupabaseBrowserClient();
   const {data,error}=await supabase.auth.signUp({email,password,options:{data:{full_name,certificate_name}}});
   if(error) throw error;
   localStorage.setItem('academia_caa_pending_course',COURSE);
   if(data.session){
    const {error:enrollError}=await supabase.rpc('create_enrollment',{course_slug:COURSE});
    if(enrollError) throw enrollError;
    localStorage.removeItem('academia_caa_pending_course'); window.location.href='/aluno/painel'; return;
   }
   setMsg('Cadastro realizado. Confirme seu e-mail e depois entre na Área do Aluno para concluir automaticamente sua matrícula.'); e.currentTarget.reset();
  }catch(err){setMsg('Não foi possível concluir o cadastro. Confira os dados e tente novamente.');}
  finally{setBusy(false);}
 }
 return <form className="formCard" onSubmit={submit}>
  <label>Nome completo<input name="full_name" type="text" required/></label><label>Nome para o certificado<input name="certificate_name" type="text" required/></label>
  <label>E-mail<input name="email" type="email" required autoComplete="email"/></label><label>Crie uma senha<input name="password" type="password" minLength={6} required autoComplete="new-password"/></label>
  <label className="check"><input type="checkbox" required/> Li e concordo com os termos e com o tratamento dos dados necessários ao cadastro e à matrícula.</label>
  <button className="button" type="submit" disabled={busy}>{busy?'Criando conta...':'Criar conta e iniciar matrícula'}</button>{msg&&<p className="safe" role="alert">{msg}</p>}
  <p className="safe">Já possui conta? <a href="/aluno">Entrar na Área do Aluno.</a></p>
 </form>;
}
