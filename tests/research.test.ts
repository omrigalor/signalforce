import {describe,it,expect,vi} from 'vitest';
import {targetDemo} from '../src/data/demo';
import {validateResearch} from '../src/domain/research';
import {plays} from '../src/data/plays';
import {collectSources,researchCompany} from '../server/research';
const allowed=plays.map(p=>p.id);
describe('Company evidence boundary',()=>{
 it('validates the saved demo and every pathway reference',()=>expect(validateResearch(targetDemo,targetDemo.sources,allowed).paths).toHaveLength(3));
 it('rejects fabricated source references',()=>{const d=structuredClone(targetDemo);d.findings[0].sourceIds=['invented'];expect(()=>validateResearch(d,d.sources,allowed)).toThrow('traceable')});
 it('rejects unsupported pathways and unresolved company diagnoses',()=>{const d=structuredClone(targetDemo);d.paths[0].evidenceIds=[];expect(()=>validateResearch(d,d.sources,allowed)).toThrow('grounded');d.paths[0].evidenceIds=['F1'];d.company.status='ambiguous';expect(()=>validateResearch(d,d.sources,allowed)).toThrow('identity')});
 it('rejects unknown people roles and duplicate coverage',()=>{const d=structuredClone(targetDemo);d.paths[0].personaId='invented';expect(()=>validateResearch(d,d.sources,allowed)).toThrow('persona');d.paths[0].personaId='operations';d.coverage[1]=d.coverage[0];expect(()=>validateResearch(d,d.sources,allowed)).toThrow('coverage')});
 it('collects only http(s) sources actually returned by the search tool',()=>{const r={output:[{type:'web_search_call',action:{sources:[{url:'https://example.com/a#fragment',title:'Report'},{url:'javascript:alert(1)',title:'Bad'}]}},{type:'message',content:[{annotations:[{type:'url_citation',url:'https://example.com/a',title:'Report'}]}]}]};expect(collectSources(r)).toEqual([{id:'S1',url:'https://example.com/a',title:'Report'}])});
 it('runs search then strict synthesis with source IDs, no legacy score weights',async()=>{
  const message=(text:string,extra:any[]=[])=>({status:'completed',output:[...extra,{type:'message',content:[{type:'output_text',text}]}]});
  const mock=vi.fn().mockResolvedValueOnce(new Response(JSON.stringify(message('Research evidence dossier',[{type:'web_search_call',action:{sources:targetDemo.sources}}])))).mockResolvedValueOnce(new Response(JSON.stringify(message(JSON.stringify(targetDemo)))));
  const phases:string[]=[];const r=await researchCompany('Target','fake-test-key',new AbortController().signal,p=>phases.push(p),'gpt-5-mini',mock);
  expect(r.paths[0].personaId).toBe('operations');expect(phases).toHaveLength(2);
  const first=JSON.parse(mock.mock.calls[0][1].body),second=JSON.parse(mock.mock.calls[1][1].body);expect(first.tools[0].type).toBe('web_search');expect(first.store).toBe(false);expect(second.text.format.strict).toBe(true);expect(second.tools).toBeUndefined();expect(second.input).not.toContain('drivers');expect(second.input).toContain('signalVocabulary');
 });
 it('surfaces quota errors without leaking provider bodies or keys',async()=>{const mock=vi.fn().mockResolvedValue(new Response('secret provider body',{status:429}));await expect(researchCompany('Target','secret-key',new AbortController().signal,()=>{},'gpt-5-mini',mock)).rejects.toThrow('quota');expect(mock).toHaveBeenCalledTimes(1)});
 it('rejects incomplete responses and empty research sources',async()=>{const mock=vi.fn().mockResolvedValue(new Response(JSON.stringify({status:'incomplete',output:[]})));await expect(researchCompany('Target','test',new AbortController().signal,()=>{},'gpt-5-mini',mock)).rejects.toThrow('incomplete')});
});
