import {useMemo,useState,useEffect} from 'react';
import {ReactFlow,Background,Controls,Handle,Position,MarkerType,useReactFlow,ReactFlowProvider,type Node,type NodeProps} from '@xyflow/react';
import {ArrowUpRight,ArrowRight,Users,Waypoints,Layers3,Box,Search,Lightbulb,TriangleAlert,MessageSquare,ShieldCheck,Goal} from 'lucide-react';
import '@xyflow/react/dist/style.css';
import {families,playById} from '../data/plays';
import {personaById} from '../data/personas';
import {productById} from '../data/catalog';
import {pathFor} from '../domain/graph';
import type {Play,GuideNode} from '../domain/types';
import type {ResearchReport} from '../domain/research';
type CardData=Record<string,unknown>&{title:string;eyebrow:string;color:string;items:{label:string;route:string}[];onGo:(route:string)=>void;dim?:boolean;onFocus?:()=>void};
function MapCard({data}:NodeProps<Node<CardData>>){return <div className={`map-node ${data.dim?'dim':''}`} style={{'--node-color':data.color} as React.CSSProperties}><Handle type="target" position={Position.Left}/><div className="node-eyebrow">{data.eyebrow}</div><div className="node-title">{data.title}</div><div className="node-items">{data.items.map(i=><button className="nodrag" key={i.route} onClick={()=>data.onGo(i.route)}>{i.label}<ArrowUpRight size={13}/></button>)}</div><Handle type="source" position={Position.Right}/></div>}
const kindIcons={signal:Search,why:Lightbulb,problem:TriangleAlert,persona:Users,motion:Layers3,product:Box,proof:ShieldCheck,action:MessageSquare,metric:Goal,partner:Users};
type PathData=Record<string,unknown>&{node:GuideNode;number:number;select:(kind:string)=>void;selected:boolean;dim:boolean};
function PathCard({data}:NodeProps<Node<PathData>>){const n=data.node,Icon=kindIcons[n.kind];return <button onClick={()=>data.select(n.kind)} className={`path-node nodrag ${data.selected?'selected':''} ${data.dim?'dim':''} kind-${n.kind}`} aria-label={`Explore ${n.label}`}><Handle id="l" type="target" position={Position.Left}/><Handle id="r" type="target" position={Position.Right}/><Handle id="t" type="target" position={Position.Top}/><Handle id="out-r" type="source" position={Position.Right}/><Handle id="out-l" type="source" position={Position.Left}/><Handle id="out-b" type="source" position={Position.Bottom}/><span className="path-kicker"><Icon size={17}/><span>{n.status}</span><b>{data.number.toString().padStart(2,'0')}</b></span><strong>{n.label}</strong><span className="path-detail">{n.detail}</span></button>}
const nodeTypes={map:MapCard,path:PathCard};
export function CompanyOverviewGraph({report,go}:{report:ResearchReport;go:(r:string)=>void}){
 const nodes:Node<CardData>[]=[],edges:any[]=[];
 report.paths.forEach((p,row)=>{
  const play=playById[p.playId];if(!play)return;
  const finding=report.findings.find(f=>p.evidenceIds.includes(f.id));
  const values=[
   {title:finding?.title||'Review the sources',eyebrow:'REPORTED EVIDENCE',items:[{label:`${p.evidenceIds.length} supporting findings`,route:`play/${p.playId}/0`}]},
   {title:play.short,eyebrow:'POSSIBLE PROBLEM',items:[{label:'Why it might matter now',route:`play/${p.playId}/1`},{label:'Pain points to test',route:`play/${p.playId}/2`}]},
   {title:personaById[p.personaId].name,eyebrow:'WHO TO APPROACH',items:[{label:'Why this role · who else to involve',route:`play/${p.playId}/3`}]},
   {title:play.motion,eyebrow:'SOLUTION APPROACH',items:[{label:'Fit, constraints & alternatives',route:`play/${p.playId}/4`}]},
   {title:productById[play.productIds[0]].canonicalName,eyebrow:'POTENTIAL PRODUCTS',items:[{label:'Product fit & prerequisites',route:`play/${p.playId}/5`},{label:'Prepare the conversation',route:`play/${p.playId}/7`}]}
  ];
  values.forEach((v,col)=>{const id=`company-${row}-${col}`;nodes.push({id,type:'map',position:{x:col*285,y:row*190},data:{...v,color:['#0176d3','#8651c4','#0b827c','#ba6a17','#0176d3'][col],onGo:go},draggable:false});if(col)edges.push({id:`edge-${id}`,source:`company-${row}-${col-1}`,target:id,type:'smoothstep',style:{stroke:'#80add3',strokeWidth:2},markerEnd:{type:MarkerType.ArrowClosed,color:'#80add3'}})});
 });
 return <div className="overview-canvas company-overview"><ReactFlowProvider><ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView minZoom={.25} maxZoom={1.7} nodesConnectable={false} nodesFocusable={false} onEdgeClick={(_,e)=>{const row=Number(e.source.split('-')[1]);go(`play/${report.paths[row].playId}/1`)}} proOptions={{hideAttribution:true}}><Background color="#d2dce8" gap={22}/><Controls showInteractive={false}/><Fit id={report.id}/></ReactFlow></ReactFlowProvider>{!nodes.length&&<div className="evidence-note">No evidence-supported paths yet. Review the company identity and research gaps.</div>}</div>
}
function Fit({id}:{id:string}){const {fitView}=useReactFlow();useEffect(()=>{const t=setTimeout(()=>fitView({padding:.06,duration:0,minZoom:.4,maxZoom:1}),80);return()=>clearTimeout(t)},[id,fitView]);return null;}
export function OverviewGraph({go,filter,motion}:{go:(r:string)=>void;filter:string[];motion:boolean}){
 const [highlight,setHighlight]=useState<string|null>(null);
 const {nodes,edges}=useMemo(()=>{
  const nodes:Node<CardData>[]=[],edges:any[]=[];
  families.forEach((f,row)=>{
   const dim=!!highlight&&highlight!==f.id;const allowed=f.playIds.some(id=>filter.includes(id));
   const values=[{title:f.personaIds.map(id=>personaById[id].short).join(' & '),eyebrow:'WHO OWNS IT',items:f.personaIds.map(id=>({label:personaById[id].name,route:`personas/${id}`}))},{title:f.title,eyebrow:'BUSINESS PROBLEMS',items:[...f.playIds.slice(0,2).map(id=>({label:playById[id].short,route:`play/${id}`})),...(f.playIds.length>2?[{label:`+ ${f.playIds.length-2} more pathways`,route:`pathways/${f.id}`}]:[])]},{title:f.solution,eyebrow:'SOLUTION APPROACH',items:f.playIds.slice(0,2).map(id=>({label:playById[id].short+' approach',route:`play/${id}`}))},{title:'Salesforce capabilities',eyebrow:'POTENTIAL PRODUCTS',items:f.products.map(id=>({label:productById[id].canonicalName,route:`products/${id}`}))}];
   values.forEach((v,col)=>{const id=`${f.id}-${col}`;nodes.push({id,type:'map',position:{x:col*310,y:row*185},data:{...v,color:f.color,onGo:go,dim:dim||!allowed},draggable:false});if(col>0)edges.push({id:`${id}-edge`,source:`${f.id}-${col-1}`,target:id,type:'smoothstep',style:{stroke:f.color,strokeWidth:highlight===f.id?2.8:1.5,opacity:(dim||!allowed)?.12:.5},markerEnd:{type:MarkerType.ArrowClosed,color:f.color},data:{family:f.id}})});
  });return {nodes,edges};
 },[go,highlight,filter]);
 return <div className={`overview-canvas ${motion?'motion':''}`} aria-label="Overall map of personas, problems, solutions and products"><ReactFlowProvider><ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView fitViewOptions={{padding:.06}} minZoom={.35} maxZoom={1.6} nodesConnectable={false} nodesFocusable={false} onNodeMouseEnter={(_,n)=>setHighlight(n.id.split('-')[0])} onNodeMouseLeave={()=>setHighlight(null)} onEdgeClick={(_,e)=>{const f=families.find(f=>f.id===e.data?.family);if(f)go(`play/${f.playIds[0]}`)}} proOptions={{hideAttribution:true}}><Background color="#d2dce8" gap={22} size={1}/><Controls showInteractive={false}/><Fit id={filter.join(',')}/></ReactFlow></ReactFlowProvider></div>
}
export function PathGraph({play,select,selected,motion,evidenceOnly}:{play:Play;select:(s:string)=>void;selected:string;motion:boolean;evidenceOnly:boolean}){
 const graph=pathFor(play);const visible=evidenceOnly?graph.nodes.filter(n=>n.status==='Published proof'):graph.nodes;
 const nodes:Node<PathData>[]=visible.map(n=>{const i=graph.nodes.indexOf(n);return {id:n.id,type:'path',position:evidenceOnly?{x:0,y:0}:{x:(i<4?i:7-i)*300,y:i<4?0:210},data:{node:n,number:i+1,select,selected:selected===n.kind,dim:!!selected&&selected!==n.kind},draggable:false}});
 const edges=evidenceOnly?[]:graph.edges.map((e,i)=>({...e,sourceHandle:i===3?'out-b':i<3?'out-r':'out-l',targetHandle:i===3?'t':i<3?'l':'r',type:'smoothstep',style:{stroke:'#6d9cd0',strokeWidth:2},markerEnd:{type:MarkerType.ArrowClosed,color:'#6d9cd0'}}));
 return <div className={`path-canvas ${motion?'motion':''}`}><ReactFlowProvider><ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView minZoom={.35} maxZoom={1.4} nodesConnectable={false} nodesFocusable={false} onEdgeClick={(_,e)=>select(`edge:${e.id}`)} proOptions={{hideAttribution:true}}><Background color="#d7e1ec" gap={22}/><Controls showInteractive={false}/><Fit id={play.id+evidenceOnly}/></ReactFlow></ReactFlowProvider>{evidenceOnly&&<div className="evidence-note">{visible.length?'Only the published customer story is evidence. The other nodes are guidance or hypotheses.':'No matched published proof is included for this pathway. Signals to investigate are not observed company facts.'}</div>}</div>
}
