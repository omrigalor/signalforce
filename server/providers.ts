export function providerFor(key:string,requestedModel?:string){
 const anthropic=key.startsWith('sk-ant-');
 return {provider:anthropic?'Anthropic':'OpenAI',model:anthropic?(requestedModel?.startsWith('claude-')?requestedModel:'claude-sonnet-4-6'):(requestedModel&&!requestedModel.startsWith('claude-')?requestedModel:'gpt-5-mini')};
}
export async function readProviderStream(response:Response,anthropic:boolean){
 if(!response.body)throw Error('The research provider returned no response stream.');
 const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='';const message:any={content:[]};
 const partial=new Map<number,string>();let final:any;
 const consume=(part:string)=>{
  const raw=part.split(/\r?\n/).filter(l=>l.startsWith('data:')).map(l=>l.slice(5).trimStart()).join('\n');
  if(!raw||raw==='[DONE]')return;const e=JSON.parse(raw);
  if(e.type==='error'||e.type==='response.failed')throw Error('The research provider interrupted generation. Retry the research request.');
  if(!anthropic){if(['response.completed','response.incomplete'].includes(e.type))final=e.response;return}
  if(e.type==='message_start')Object.assign(message,e.message);
  if(e.type==='content_block_start')message.content[e.index]=structuredClone(e.content_block);
  if(e.type==='content_block_delta'){
   const b=message.content[e.index],d=e.delta;if(!b)return;
   if(d.type==='text_delta')b.text=(b.text||'')+d.text;
   if(d.type==='input_json_delta')partial.set(e.index,(partial.get(e.index)||'')+d.partial_json);
   if(d.type==='citations_delta')(b.citations??=[]).push(d.citation);
   if(d.type==='thinking_delta')b.thinking=(b.thinking||'')+d.thinking;
   if(d.type==='signature_delta')b.signature=(b.signature||'')+d.signature;
  }
  if(e.type==='content_block_stop'&&partial.has(e.index))message.content[e.index].input=JSON.parse(partial.get(e.index)!);
  if(e.type==='message_delta')Object.assign(message,e.delta);
  if(e.type==='message_stop')final=message;
 };
 try{while(true){const chunk=await reader.read();if(chunk.done)break;buffer+=decoder.decode(chunk.value,{stream:true});const parts=buffer.split(/\r?\n\r?\n/);buffer=parts.pop()||'';for(const part of parts)consume(part)}if(buffer.trim())consume(buffer);if(!final)throw Error('The research response was interrupted before completion.');return final;}finally{await reader.cancel().catch(()=>{})}
}
// Claude's JSON-schema subset omits string/array length constraints; Zod still
// validates those limits locally after synthesis.
function claudeSchema(value:any):any{
 if(Array.isArray(value))return value.map(claudeSchema);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([k])=>!['$schema','minLength','maxLength','minItems','maxItems','minimum','maximum','format'].includes(k)).map(([k,v])=>[k,claudeSchema(v)]));
 return value;
}
export async function callProvider(body:any,key:string,requestedModel:string,signal:AbortSignal,fetcher:typeof fetch=fetch){
 const {provider,model}=providerFor(key,requestedModel),anthropic=provider==='Anthropic';
 const endpoint=anthropic?'https://api.anthropic.com/v1/messages':'https://api.openai.com/v1/responses';
 const headers:Record<string,string>=anthropic?{'x-api-key':key,'anthropic-version':'2023-06-01','Content-Type':'application/json'}:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'};
 const payload:any=anthropic?{model,max_tokens:body.max_output_tokens,system:body.instructions,messages:[{role:'user',content:body.input}],...(body.tools?{tools:[{type:'web_search_20250305',name:'web_search',max_uses:8},{type:'web_fetch_20250910',name:'web_fetch',max_uses:4,max_content_tokens:12000,citations:{enabled:true}}]}:{}),...(body.text?{output_config:{format:{type:'json_schema',schema:claudeSchema(body.text.format.schema)}}}:{})}:{model,store:false,reasoning:{effort:'medium'},...body};
 const allBlocks:any[]=[];
 for(let turn=0;turn<3;turn++){
  const response=await fetcher(endpoint,{method:'POST',signal,headers,body:JSON.stringify({...payload,stream:true})});
  if(!response.ok){const messages:Record<number,string>={400:`${provider} could not accept the research request. Check model/tool access and API billing.`,401:`${provider} rejected the API key. Run Set Up SignalForce Research.command to replace it.`,403:`This ${provider} project does not have access to the selected model or web search.`,429:`${provider} API quota or rate limit reached. Check the API project’s billing and limits, then retry.`};throw Error(messages[response.status]||`${provider} returned HTTP ${response.status}. Please retry later.`)}
  const data=response.headers.get('content-type')?.includes('text/event-stream')?await readProviderStream(response,anthropic):await response.json();if(!anthropic)return data;
  allBlocks.push(...(data.content||[]));
  if(data.stop_reason==='pause_turn'&&turn<2){payload.messages.push({role:'assistant',content:data.content});continue}
  const sources:any[]=[];const add=(s:any)=>{if(s?.url)sources.push({url:s.url,title:s.title})};
  for(const b of allBlocks){if(b.type==='web_search_tool_result'&&Array.isArray(b.content))for(const s of b.content)add(s);if(b.type==='web_fetch_tool_result')add(b.content);for(const c of b.citations||[])add(c)}
  const text=allBlocks.filter(b=>b.type==='text').map(b=>b.text+(body.tools&&b.citations?.length?'\nCitations: '+JSON.stringify(b.citations.map((c:any)=>({url:c.url,title:c.title,cited_text:c.cited_text}))):'')).join('\n');
  return {status:data.stop_reason==='end_turn'?'completed':'incomplete',output:[{type:'web_search_call',action:{sources}},{type:'message',content:[{type:'output_text',text}]}]};
 }
 throw Error('Research exceeded its bounded tool continuation limit.');
}
