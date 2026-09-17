import { NextResponse } from 'next/server';

export async function POST(request){
 try{
  if(!process.env.PAGBANK_TOKEN) return NextResponse.json({error:'Pagamento ainda não configurado.'},{status:503});
  return NextResponse.json({ready:true,message:'Integração PagBank configurada no servidor. A geração da cobrança será habilitada após validação autenticada da matrícula.'});
 }catch{return NextResponse.json({error:'Não foi possível iniciar o pagamento.'},{status:500});}
}
