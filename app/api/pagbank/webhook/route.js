import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabaseAdmin } from '../../../../lib/supabase-admin';

function safeEqualHex(a,b){try{const aa=Buffer.from(String(a).toLowerCase(),'hex');const bb=Buffer.from(String(b).toLowerCase(),'hex');return aa.length===bb.length&&aa.length>0&&crypto.timingSafeEqual(aa,bb);}catch{return false;}}

export async function POST(request){
 try{
  const token=process.env.PAGBANK_TOKEN;
  if(!token) return NextResponse.json({error:'Webhook não configurado.'},{status:503});
  const raw=await request.text();
  const legacy=request.headers.get('x-authenticity-token');
  // Pedidos & Pagamentos (Order): documentação oficial vincula a confirmação SHA-256 token-payload.
  const expected=crypto.createHash('sha256').update(`${token}-${raw}`,'utf8').digest('hex');
  if(!legacy||!safeEqualHex(legacy,expected)) return NextResponse.json({error:'Assinatura inválida.'},{status:401});
  let event; try{event=JSON.parse(raw);}catch{return NextResponse.json({error:'Payload inválido.'},{status:400});}
  const charges=Array.isArray(event?.charges)?event.charges:(event?.id&&event?.status?[event]:[]);
  if(!charges.length) return new NextResponse(null,{status:204});
  const admin=getSupabaseAdmin();
  for(const charge of charges){
   if(!charge?.id) continue;
   const {data:payment}=await admin.from('payments').select('id,enrollment_id,status').eq('provider','pagbank').eq('provider_payment_id',charge.id).maybeSingle();
   if(!payment) continue;
   const map={WAITING:'pending',IN_ANALYSIS:'processing',PAID:'paid',DECLINED:'failed',CANCELED:'cancelled',CANCELLED:'cancelled',REFUNDED:'refunded'};
   const status=map[charge.status]||payment.status;
   const update={status,updated_at:new Date().toISOString()};
   if(status==='paid') update.paid_at=new Date().toISOString();
   await admin.from('payments').update(update).eq('id',payment.id);
   if(status==='paid') await admin.from('enrollments').update({status:'active',updated_at:new Date().toISOString()}).eq('id',payment.enrollment_id).in('status',['pending','paid']);
   if(status==='refunded') await admin.from('enrollments').update({status:'refunded',updated_at:new Date().toISOString()}).eq('id',payment.enrollment_id);
   if(status==='cancelled') await admin.from('enrollments').update({status:'cancelled',updated_at:new Date().toISOString()}).eq('id',payment.enrollment_id).eq('status','pending');
  }
  return new NextResponse(null,{status:204});
 }catch{return NextResponse.json({error:'Falha ao processar notificação.'},{status:500});}
}
