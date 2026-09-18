import {z} from 'zod';
const schema=z.object({version:z.literal(1),motion:z.boolean(),saved:z.array(z.object({playId:z.string(),companyId:z.string(),note:z.string().max(20000),updatedAt:z.string(),stage:z.string(),checks:z.array(z.string())}))});
export type Workspace=z.infer<typeof schema>;
const initial:Workspace={version:1,motion:true,saved:[]};
export function loadWorkspace():{workspace:Workspace;error:string}{try{const raw=localStorage.getItem('signalgraph.workspace');return {workspace:raw?schema.parse(JSON.parse(raw)):initial,error:''}}catch{return {workspace:initial,error:'Saved workspace could not be read. You can still explore the map; export any notes you need before resetting local data.'}}}
export function persist(workspace:Workspace){try{localStorage.setItem('signalgraph.workspace',JSON.stringify(schema.parse(workspace)));return ''}catch{return 'Your browser could not save locally. Export your notes to keep them.'}}
export function parseWorkspace(raw:string){return schema.parse(JSON.parse(raw));}
export function download(name:string,content:string,type='text/plain'){const a=document.createElement('a');const url=URL.createObjectURL(new Blob([content],{type}));a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
