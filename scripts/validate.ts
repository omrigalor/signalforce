import {plays,companyTypes,families} from '../src/data/plays';
import {products,proofSources} from '../src/data/catalog';
import {personas} from '../src/data/personas';
import {validateReferences} from '../src/domain/graph';
import {proofSchema} from '../src/domain/types';
validateReferences(plays);
for(const rows of [plays,companyTypes,products,personas,proofSources])if(new Set(rows.map(r=>r.id)).size!==rows.length)throw Error('Duplicate IDs');
for(const c of companyTypes)for(const id of c.playIds)if(!plays.some(p=>p.id===id))throw Error('Invalid company context path');
for(const f of families){for(const id of f.playIds)if(!plays.some(p=>p.id===id))throw Error('Invalid family play');for(const id of f.products)if(!products.some(p=>p.id===id))throw Error('Invalid family product');}
for(const p of proofSources){proofSchema.parse(p);for(const id of p.productIds)if(!products.some(p=>p.id===id))throw Error('Invalid proof product');}
for(const p of products)if(p.verified&&!p.officialUrl.startsWith('https://'))throw Error('Reviewed product lacks official source');
console.log(`Validated ${plays.length} pathways, ${personas.length} personas, ${products.length} product references, ${companyTypes.length-1} company contexts, and all graph edges.`);
