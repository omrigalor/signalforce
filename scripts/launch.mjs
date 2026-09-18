import {spawn,execFile} from 'node:child_process';
import {mkdir,open} from 'node:fs/promises';
import {homedir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const address='http://127.0.0.1:43187';
async function ready(){try{const r=await fetch(address+'/api/status',{signal:AbortSignal.timeout(1500)});const s=await r.json();if(s.app!=='SignalGraph'||s.version!==2)throw Error('The local app port is occupied by another application.');return true}catch(e){if(e.message.includes('occupied'))throw e;return false}}
try{
 if(!await ready()){
  const dir=join(homedir(),'Library','Application Support','SignalGraph');await mkdir(dir,{recursive:true,mode:0o700});
  const log=await open(join(dir,'server.log'),'a',0o600);
  const child=spawn(process.execPath,[join(root,'dist-server','server.mjs')],{cwd:root,detached:true,stdio:['ignore',log.fd,log.fd]});child.on('error',()=>{});child.unref();await log.close();
  let started=false;for(let i=0;i<60;i++){await new Promise(r=>setTimeout(r,250));if(await ready()){started=true;break}}
  if(!started)throw Error('The local app did not start. See ~/Library/Application Support/SignalGraph/server.log.');
 }
 if(process.argv.includes('--check'))console.log('SignalForce startup check passed: local server is ready.');
 else {console.log('SignalForce is ready. Opening the map. You can close this Terminal window.');
 execFile('/usr/bin/open',[address],error=>{if(error)console.log('Open this address in your browser: '+address)});}
}catch(e){console.error(e.message);process.exitCode=1}
