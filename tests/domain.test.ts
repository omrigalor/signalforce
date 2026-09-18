import {describe,it,expect} from 'vitest';
import {plays} from '../src/data/plays';
import {pathFor,validateReferences} from '../src/domain/graph';
import {answerFromMap} from '../src/services/guide';
import {parseWorkspace} from '../src/services/storage';
describe('Guidance integrity',()=>{
 it('has valid complete paths and concise generic openers',()=>expect(()=>validateReferences(plays)).not.toThrow());
 it('does not mislabel signals or hypotheses as observed evidence',()=>{for(const p of plays){const g=pathFor(p);expect(g.nodes.find(n=>n.kind==='signal')?.status).toBe('Validate');expect(g.nodes.find(n=>n.kind==='why')?.status).toBe('Hypothesis');expect(g.nodes.filter(n=>n.status==='Published proof').every(n=>n.kind==='proof')).toBe(true)}});
 it('does not invent a proof point for a missing example',()=>{const p=plays.find(p=>p.id==='integration')!;expect(answerFromMap('Show me proof',p).text).toContain('no closely matched');expect(pathFor(p).nodes.find(n=>n.kind==='proof')?.status).toBe('Evidence gap')});
 it('declines arbitrary company research instead of fabricating',()=>expect(answerFromMap('What is Acme revenue?',plays[0]).text).toContain('does not research companies'));
 it('keeps counter-explanations accessible and mapped',()=>{const a=answerFromMap('What could make this wrong?',plays[0]);expect(a.text).toContain(plays[0].counter[0]);expect(a.section).toBe('why')});
 it('rejects malformed workspace imports without executing them',()=>{expect(()=>parseWorkspace('{"version":1,"saved":"bad"}')).toThrow();expect(()=>parseWorkspace('<script>alert(1)</script>')).toThrow()});
 it('returns role-specific metrics without inventing a named contact',()=>{const a=answerFromMap('How would this change for the CIO?',plays[0]);expect(a.text).toContain('Change lead time');expect(a.text).toContain('ownership must be confirmed')});
});
