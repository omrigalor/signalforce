import type {Play} from '../domain/types';
import {personaById} from '../data/personas';
import {productById} from '../data/catalog';
export function answerFromMap(question:string,p:Play):{title:string;text:string;section:string}{
 const q=question.toLowerCase();
 if(/wrong|risk|assum|invalid|counter/.test(q))return {title:'Test the hypothesis',text:p.counter.join('\n\n'),section:'why'};
 if(/cio|technolog|architect/.test(q))return {title:'For a technology leader',text:`Lead with ${personaById.technology.metrics.slice(0,2).join(' and ')}. Ask: ${personaById.technology.questions[0]}\n\n${p.prerequisites.join('. ')}. The business problem stays the same; technical ownership must be confirmed.`,section:'persona'};
 if(/who|persona|contact|call first/.test(q)){const role=personaById[p.personaId];return {title:'Start with the outcome owner',text:`${role.name} commonly owns ${p.metrics.slice(0,2).join(' and ')}. Confirm their mandate. Bring in ${p.partnerIds.map(id=>personaById[id].name).join(' and ')} when their responsibilities are involved.`,section:'persona'};}
 if(/opener|say|start|pitch/.test(q))return {title:'A permission-based starting point',text:p.opener+'\n\nUse this as a question, not an assertion that the prospect has this problem.',section:'action'};
 if(/product|salesforce|solution/.test(q))return {title:'Capability before product',text:p.motion+'\n\nPossible products: '+p.productIds.map(id=>productById[id].canonicalName).join(', ')+'.\n\nValidate first: '+p.prerequisites.join('; ')+'.',section:'product'};
 if(/proof|case study|example/.test(q))return {title:p.proofIds.length?'A related example, not a promised result':'Evidence gap',text:p.proofIds.length?'Salesforce’s SharkNinja story illustrates connected commerce, data, and service automation. It is vendor-published evidence in consumer products; validate comparability before using it.':'There is no closely matched customer story in this local guide for this pathway. Do not substitute an unrelated logo or invent an outcome.',section:'proof'};
 if(/why|signal|trigger|now/.test(q))return {title:'A hypothesis to investigate',text:p.hypothesis+'\n\nLook for: '+p.signalPrompts.map(s=>s.label).join('; ')+'. None of these are known facts about a specific company.',section:'signal'};
 if(/ask|question|discover|next/.test(q))return {title:'Discover → understand impact → current approach',text:p.discovery.join('\n\n'),section:'action'};
 return {title:'Stay grounded in the map',text:'This offline guide explains the authored pathways; it does not research companies or answer arbitrary factual questions. Try “Who owns this?”, “What should I ask?”, “What could make this wrong?”, or “Which product fits?”',section:'signal'};
}
