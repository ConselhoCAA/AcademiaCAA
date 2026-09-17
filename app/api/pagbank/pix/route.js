import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase-admin';

const PAGBANK_URL='https://api.pagseguro.com/orders';

export async function POST(request){
 let stage='start';
 try{
  stage='config';
  const token=process.env.PAGBANK_TOKEN;
  if(!token) return NextResponse.json({error:'Pagamento ainda não configurado.'},{status:503});
  const auth=request.headers.get('authorization')||'';
  const accessToken=auth.startsWith('Bearer ')?auth.slice(7):'';
  if(!accessToken) return NextResponse.json({error:'Sessão necessária.'},{status:401});
  stage='supabase_admin';
  const admin=getSupabaseAdmin();
  stage='auth_user';
  const {data:{user},error:userError}=await admin.auth.getUser(accessToken);
  if(userError||!user) return NextResponse.json({error:'Sessão inválida.'},{status:401});
  stage='request_body';
  const {enrollment_id}=await request.json();
  if(!enrollment_id) return NextResponse.json({error:'Matrícula não informada.'},{status:400});
  stage='enrollment';
  const {data:e,error:eError}=await admin.from('enrollments').select('id,user_id,status,courses(id,title,price_cents,currency)').eq('id',enrollment_id).eq('user_id',user.id).single();
  if(eError||!e) return NextResponse.json({error:'Matrícula não encontrada.'},{status:404});
  if(['paid','active','completed'].includes(e.status)) return NextResponse.json({error:'Esta matrícula já está paga.'},{status:409});
  stage='existing_payment';
  const {data:existing,error:existingError}=await admin.from('payments').select('id,status,pix_code,qr_code_url,expires_at,provider_payment_id').eq('enrollment_id',e.id).eq('provider','pagbank').in('status',['pending','processing']).order('created_at',{ascending:false}).limit(1).maybeSingle();
  if(existingError) throw new Error(`PAYMENT_LOOKUP:${existingError.code||'unknown'}`);
  if(existing?.pix_code && (!existing.expires_at || new Date(existing.expires_at)>new Date())) return NextResponse.json({payment:existing,reused:true});
  const expires=new Date(Date.now()+24*60*60*1000).toISOString();
  const appUrl=process.env.APP_URL||'https://academia-khaki-mu.vercel.app';
  const body={reference_id:e.id,customer:{name:user.user_metadata?.full_name||user.user_metadata?.certificate_name||'Aluno Academia CAA',email:user.email},items:[{reference_id:e.courses.id,name:e.courses.title,quantity:1,unit_amount:e.courses.price_cents}],charges:[{reference_id:e.id,description:e.courses.title,amount:{value:e.courses.price_cents,currency:e.courses.currency||'BRL'},payment_method:{type:'PIX',pix:{expiration_date:expires}}}],notification_urls:[`${appUrl}/api/webhooks/pagbank`]};
  stage='pagbank_request';
  const response=await fetch(PAGBANK_URL,{method:'POST',headers:{Authorization:`Bearer ${token}`,Accept:'application/json','Content-Type':'application/json'},body:JSON.stringify(body),cache:'no-store'});
  const pg=await response.json().catch(()=>({}));
  if(!response.ok){console.error('PIX_PAGBANK_REJECTED',{status:response.status,codes:pg?.error_messages?.map(x=>x.code).filter(Boolean)});return NextResponse.json({error:'O PagBank não autorizou a criação do PIX.',details:pg?.error_messages?.map(x=>x.description).filter(Boolean)},{status:502});}
  const charge=pg.charges?.[0];
  const qr=charge?.qr_code;
  const png=charge?.links?.find(x=>x.rel==='QRCODE.PNG')?.href||null;
  if(!charge?.id||!qr?.text) return NextResponse.json({error:'O PagBank não retornou um QR Code válido.'},{status:502});
  stage='save_payment';
  const payment={enrollment_id:e.id,provider:'pagbank',provider_payment_id:charge.id,amount_cents:e.courses.price_cents,currency:e.courses.currency||'BRL',status:charge.status==='WAITING'?'pending':'processing',pix_code:qr.text,qr_code_url:png,expires_at:expires,updated_at:new Date().toISOString()};
  const {data:saved,error:saveError}=await admin.from('payments').insert(payment).select('id,status,pix_code,qr_code_url,expires_at,provider_payment_id').single();
  if(saveError){console.error('PIX_SAVE_FAILED',{code:saveError.code});return NextResponse.json({error:'PIX criado, mas não foi possível registrar a cobrança.'},{status:500});}
  return NextResponse.json({payment:saved});
 }catch(error){
  console.error('PIX_ROUTE_FAILED',{stage,name:error?.name,message:String(error?.message||'unknown').slice(0,160)});
  if(error?.message==='SUPABASE_ADMIN_NOT_CONFIGURED') return NextResponse.json({error:'Configuração segura do banco ainda pendente.'},{status:503});
  return NextResponse.json({error:'Não foi possível iniciar o pagamento.'},{status:500});
 }
}
