import {z} from 'zod';
export const coverageAreas=['Annual filings','Earnings & outlook','Hiring','Strategy & expansion','Leadership','Technology & operations','Customer experience','Financial constraints'] as const;
const text=z.string().min(1).max(5000);
const ids=z.array(z.string()).max(30);
export const researchDraftSchema=z.object({
 company:z.object({name:text,website:z.string(),description:text,status:z.enum(['resolved','ambiguous','insufficient']),identityNote:text}),
 coverage:z.array(z.object({area:z.enum(coverageAreas),status:z.enum(['found','limited','not found','not applicable']),note:text,sourceIds:ids})).max(8),
 findings:z.array(z.object({id:text,title:text,detail:text,sourceIds:ids,publishedDate:z.string().nullable(),period:z.string().nullable(),limitation:text})).max(24),
 paths:z.array(z.object({playId:text,evidenceIds:ids,personaId:text,personaRationale:text,partners:z.array(z.object({personaId:text,why:text})).max(4),painPoints:z.array(text).min(1).max(4),qualification:z.array(text).min(2).max(5),solutionFit:text,productFit:text,whyNow:text,hypothesis:text,counter:text,opener:text,questions:z.array(text).min(3).max(3),nextStep:text})).max(5),
 gaps:z.array(text).max(16)
});
export type ResearchDraft=z.infer<typeof researchDraftSchema>;
export const sourceSchema=z.object({id:z.string(),url:z.url().refine(u=>/^https?:\/\//.test(u)),title:z.string()});
export const reportSchema=researchDraftSchema.extend({id:z.string(),query:z.string(),createdAt:z.string(),model:z.string(),sources:z.array(sourceSchema),warnings:z.array(z.string())});
export type ResearchReport=z.infer<typeof reportSchema>;
export type ResearchPath=ResearchReport['paths'][number];
export function validateResearch(draft:unknown,sources:z.infer<typeof sourceSchema>[],allowedPlays:string[],allowedPersonas:string[]=['revenue','service','digital','marketing','technology','operations','data']){
 const d=researchDraftSchema.parse(draft),known=new Set(sources.map(s=>s.id));
 if(d.coverage.length!==coverageAreas.length||new Set(d.coverage.map(c=>c.area)).size!==coverageAreas.length)throw Error('Research coverage is incomplete. Please retry.');
 if(new Set(d.findings.map(f=>f.id)).size!==d.findings.length)throw Error('Duplicate evidence identifiers. Please retry.');
 for(const f of d.findings)if(!f.sourceIds.length||f.sourceIds.some(id=>!known.has(id)))throw Error('A finding has no traceable source. Please retry.');
 for(const c of d.coverage)if(c.sourceIds.some(id=>!known.has(id))||(c.status==='found'&&!c.sourceIds.length))throw Error('Untraceable coverage claim. Please retry.');
 const findings=new Set(d.findings.map(f=>f.id));
 for(const p of d.paths)if(!allowedPlays.includes(p.playId)||!p.evidenceIds.length||p.evidenceIds.some(id=>!findings.has(id)))throw Error('A suggested pathway is not grounded in the retrieved evidence. Please retry.');
 for(const p of d.paths)if(!allowedPersonas.includes(p.personaId)||p.partners.some(x=>!allowedPersonas.includes(x.personaId)))throw Error('Unknown persona in research. Please retry.');
 if(new Set(d.paths.map(p=>p.playId)).size!==d.paths.length)throw Error('Duplicate pathways. Please retry.');
 if(d.company.status!=='resolved'&&d.paths.length)throw Error('Company identity must be resolved before mapping pathways. Try the company website.');
 return d;
}
