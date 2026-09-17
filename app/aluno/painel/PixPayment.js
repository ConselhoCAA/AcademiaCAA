'use client';
import { useState } from 'react';
import { getSupabaseBrowserClient } from '../../../lib/supabase';

export default function PixPayment({enrollmentId}){
 const [payment,setPayment]=useState(null); const [loading,setLoading]=useState(false); const [message,setMessage]=useState('');
 async function gerar(){
  setLoading(true);setMessage('');
  try{
   const supabase=getSupabaseBrowserClient();
   const {data:{session}}=await supabase.auth.getSession();
   if(!session?.access_token) throw new Error('NO_SESSION');
   const response=await fetch('/api/pagbank/pix',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`},body:JSON.stringify({enrollment_id:enrollmentId})});
   const data=await response.json();
   if(!response.ok) throw new Error(data?.error||'PAYMENT_ERROR');
   setPayment(data.payment);
  }catch(error){setMessage(error?.message==='NO_SESSION'?'Sua sessão expirou. Entre novamente.':error?.message||'Não foi possível gerar o PIX.');}
  finally{setLoading(false);}
 }
 async function copiar(){try{await navigator.clipboard.writeText(payment.pix_code);setMessage('Código PIX copiado.');}catch{setMessage('Selecione e copie o código PIX abaixo.');}}
 if(!payment)return <div className="pixBox"><p>Seu lugar está reservado. Gere o PIX para concluir a matrícula.</p><button className="button" onClick={gerar} disabled={loading}>{loading?'Gerando PIX...':'Gerar PIX'}</button>{message&&<p className="safe" role="alert">{message}</p>}</div>;
 return <div className="pixBox"><p className="gold">PIX GERADO</p>{payment.qr_code_url&&<img className="pixQr" src={payment.qr_code_url} alt="QR Code PIX para pagamento"/>}<label>PIX Copia e Cola<textarea className="pixCode" readOnly value={payment.pix_code}/></label><button className="button" onClick={copiar}>Copiar código PIX</button><p className="safe">Após o pagamento, a confirmação será processada automaticamente. Validade: {payment.expires_at?new Date(payment.expires_at).toLocaleString('pt-BR'): 'conforme a cobrança'}.</p>{message&&<p className="safe" role="alert">{message}</p>}</div>;
}
