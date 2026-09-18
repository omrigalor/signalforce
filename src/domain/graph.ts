import type {Play,GuideNode,GuideEdge} from './types';
import {personaById} from '../data/personas';
import {productById,proofSources} from '../data/catalog';
export function pathFor(play:Play):{nodes:GuideNode[];edges:GuideEdge[]}{
 const persona=personaById[play.personaId];
 const nodes:GuideNode[]=[
  {id:'signal',kind:'signal',label:'Signals to investigate',detail:play.signalPrompts[0].label,status:'Validate'},
  {id:'why',kind:'why',label:'Why this might matter now',detail:play.hypothesis,status:'Hypothesis'},
  {id:'problem',kind:'problem',label:play.short,detail:play.problem,status:'Hypothesis'},
  {id:'persona',kind:'persona',label:persona.name,detail:persona.metrics.slice(0,2).join(' · '),status:'Guidance',referenceId:persona.id},
  {id:'motion',kind:'motion',label:'The solution approach',detail:play.motion,status:'Guidance'},
  {id:'product',kind:'product',label:productById[play.productIds[0]].canonicalName,detail:play.productIds.slice(1).map(id=>productById[id].canonicalName).join(' · '),status:'Guidance',referenceId:play.productIds[0]},
  {id:'proof',kind:'proof',label:play.proofIds.length?'A comparable example':'Proof still needed',detail:play.proofIds.length?'SharkNinja · vendor-published story':'Find a comparable, source-backed customer example.',status:play.proofIds.length?'Published proof':'Evidence gap'},
  {id:'action',kind:'action',label:'Start a useful conversation',detail:play.ask,status:'Guidance'}
 ];
 const reasons=[['SUPPORTS','A signal can support this hypothesis only after its scope, timing, and alternative explanations are checked.'],['SUGGESTS','The hypothesis suggests a problem to validate; it does not establish that the prospect has the problem.'],['OWNED_BY','This role commonly owns the listed outcomes. Confirm ownership and decision rights in this organization.'],['ADDRESSED_BY','This approach addresses the problem if the underlying constraint matches the discovery findings.'],['ENABLED_BY','These capabilities may support the approach. Product fit depends on prerequisites, architecture, and the actual use case.'],['SUPPORTED_BY','A published story can illustrate a related use case. It does not predict the prospect’s outcome.'],['SHAPES','Use the evidence, its limits, and the role’s metrics to frame a small next step.']];
 return {nodes,edges:nodes.slice(0,-1).map((n,i)=>({id:`${n.id}-${nodes[i+1].id}`,source:n.id,target:nodes[i+1].id,relation:reasons[i][0],reason:reasons[i][1]}))};
}
export function validateReferences(plays:Play[]){
 for(const p of plays){
  if(!personaById[p.personaId])throw Error(`Missing persona ${p.personaId}`);
  for(const id of p.partnerIds)if(!personaById[id])throw Error(`Missing partner ${id}`);
  for(const id of p.productIds)if(!productById[id])throw Error(`Missing product ${id}`);
  for(const id of p.proofIds)if(!proofSources.some(s=>s.id===id))throw Error(`Missing proof ${id}`);
  if(p.opener.split(/\s+/).length>55)throw Error(`Opener too long ${p.id}`);
  const graph=pathFor(p),ids=new Set(graph.nodes.map(n=>n.id));
  if(ids.size!==graph.nodes.length)throw Error('Duplicate nodes');
  for(const e of graph.edges)if(!ids.has(e.source)||!ids.has(e.target))throw Error('Dangling edge');
 }
}
