import http from 'node:http';
import {readFile,mkdir,writeFile,readdir,unlink,chmod} from 'node:fs/promises';
import {homedir} from 'node:os';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes,randomUUID,createHash} from 'node:crypto';
import {providerFor} from './providers';
import {researchCompany} from './research';
import {reportSchema} from '../src/domain/research';
const port=43187,origin=`http://127.0.0.1:${port}`,token=randomBytes(32).toString('hex');
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const data=join(homedir(),'Library','Application Support','SignalGraph'),reports=join(data,'reports');
await mkdir(reports,{recursive:true,mode:0o700});
await chmod(data,0o700);await chmod(reports,0o700);
type Job={id:string;status:string;phase:string;controller:AbortController;report?:unknown;error?:string};
const jobs=new Map<string,Job>();let active:Job|undefined;
async function credentials(){try{const c=JSON.parse(await readFile(join(data,'credentials.json'),'utf8'));return {key:String(c.apiKey||''),model:String(c.model||'gpt-5-mini')}}catch{return {key:process.env.OPENAI_API_KEY||'',model:process.env.SIGNALGRAPH_MODEL||'gpt-5-mini'}}}
async function body(req:http.IncomingMessage){let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>4096)throw Error('Request too large.')}return JSON.parse(raw||'{}')}
const server=http.createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Cache-Control','no-store');res.setHeader('X-Frame-Options','DENY');
 const send=(status:number,value:unknown)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(value))};
 if(req.headers.host!==`127.0.0.1:${port}`){send(403,{error:'Invalid host.'});return}
 if(req.headers.origin&&req.headers.origin!==origin){send(403,{error:'Cross-origin access rejected.'});return}
 if(req.method!=='GET'&&(req.headers.origin!==origin||req.headers['x-signalgraph-token']!==token||!req.headers['content-type']?.startsWith('application/json'))){send(403,{error:'Reload SignalForce to refresh the local session.'});return}
 const path=new URL(req.url||'/',origin).pathname;
 try{
  if(req.method==='GET'&&path==='/api/status'){const c=await credentials();send(200,{app:'SignalGraph',version:2,configured:!!c.key,...providerFor(c.key,c.model),token});return}
  if(req.method==='GET'&&path==='/api/reports'){
   const list=[];for(const name of (await readdir(reports)).filter(n=>/^[\w-]+\.json$/.test(n)).slice(-100)){try{list.push(reportSchema.parse(JSON.parse(await readFile(join(reports,name),'utf8'))))}catch{}}
   send(200,list.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)));return;
  }
  if(req.method==='POST'&&path==='/api/research'){
   if(active){send(409,{error:'Another company is being researched. Wait or cancel it first.'});return}
   const input=await body(req),query=typeof input.query==='string'?input.query.trim():'';
   if(query.length<2||query.length>200||/[\x00-\x1f]/.test(query)){send(400,{error:'Enter a company name or website (2–200 characters).'});return}
   const c=await credentials();if(!c.key){send(400,{error:'Run Set Up SignalForce Research.command on your Desktop first.'});return}
   // Explicit user clicks create jobs. No automatic retries or paid background refreshes.
   const job:Job={id:randomUUID(),status:'running',phase:'Starting research',controller:new AbortController()};active=job;jobs.set(job.id,job);
   for(const [id,old] of jobs)if(old.status!=='running'&&jobs.size>20)jobs.delete(id);
   const timeout=setTimeout(()=>job.controller.abort('timeout'),10*60*1000);
   send(202,{id:job.id});
   const checkpointPath=join(data,'pending-'+createHash('sha256').update(providerFor(c.key,c.model).model+'\0'+query.toLowerCase()).digest('hex')+'.json');
   const checkpoint={load:async()=>{try{const d=JSON.parse(await readFile(checkpointPath,'utf8'));return Date.now()-Date.parse(d._collectedAt)<30*60*1000?d:null}catch{return null}},save:async(r:unknown)=>{await writeFile(checkpointPath,JSON.stringify(r),{mode:0o600})},clear:async()=>{await unlink(checkpointPath).catch(()=>{})}};
   void researchCompany(query,c.key,job.controller.signal,s=>{job.phase=s},c.model,fetch,checkpoint).then(async report=>{
    if(job.controller.signal.aborted)return;
    await writeFile(join(reports,`${report.id}.json`),JSON.stringify(report,null,2),{mode:0o600});job.report=report;job.status='complete';job.phase='Ready';
   }).catch(e=>{job.status=job.controller.signal.aborted?'cancelled':'failed';job.error=job.controller.signal.aborted?(job.controller.signal.reason==='timeout'?'Research timed out. Try a more specific company website.':'Research cancelled. Some API usage may already have occurred.'):(e instanceof Error?e.message:'Research failed.');}).finally(()=>{clearTimeout(timeout);if(job.status==='running')job.status='cancelled';if(active===job)active=undefined});return;
  }
  const match=path.match(/^\/api\/jobs\/([\w-]+)$/);
  if(match&&req.method==='GET'){const j=jobs.get(match[1]);if(!j){send(404,{error:'Research session not found. Check saved research.'});return}send(200,{id:j.id,status:j.status,phase:j.phase,report:j.report,error:j.error});return}
  if(path==='/api/cancel'&&req.method==='POST'){const input=await body(req);const job=jobs.get(input.id);job?.controller.abort('cancelled');send(200,{ok:true});return}
  if(path==='/api/delete'&&req.method==='POST'){const input=await body(req);if(typeof input.id!=='string'||! /^[\w-]{1,80}$/.test(input.id)){send(400,{error:'Invalid report.'});return}await unlink(join(reports,`${input.id}.json`)).catch(()=>{});send(200,{ok:true});return}
  if(req.method==='GET'&&(path==='/'||path==='/index.html')){res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'none'");res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(await readFile(join(root,'dist','index.html')));return}
  send(404,{error:'Not found.'});
 }catch{send(400,{error:'The local request could not be processed. Check the input and retry.'})}
});
server.requestTimeout=15000;
server.listen(port,'127.0.0.1',()=>console.log(`SignalForce is ready at ${origin}`));
server.on('error',e=>{console.error((e as NodeJS.ErrnoException).code==='EADDRINUSE'?'SignalForce’s local port is already in use. Close the other instance or use its existing window.':'The local server could not start.');process.exitCode=1});
for(const sig of ['SIGTERM','SIGINT'] as const)process.on(sig,()=>{active?.controller.abort('shutdown');server.close(()=>process.exit(0))});
