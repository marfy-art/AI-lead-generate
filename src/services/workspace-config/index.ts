export type ProviderSetting={id:string;name:string;enabled:boolean;priority:number;capabilities:string[];estimatedCost:string;termsReviewStatus:"approved"|"pending"|"not_required"};
export type WorkspaceConfig={leadThreshold:number;confidenceThreshold:number;retentionDays:number;mockMode:boolean;services:string[];providers:ProviderSetting[]};
const defaults:WorkspaceConfig={leadThreshold:70,confidenceThreshold:65,retentionDays:180,mockMode:true,services:["Photography","Videography","Graphic Design","Digital Marketing","Web Development","Event Planning","Tutoring","Home Services"],providers:[
  {id:"mock",name:"Mock providers",enabled:true,priority:1,capabilities:["All MVP capabilities"],estimatedCost:"Free",termsReviewStatus:"not_required"},
  {id:"openStreetMap",name:"OpenStreetMap lookup",enabled:false,priority:2,capabilities:["Card-free company lookup"],estimatedCost:"Free · strict fair-use limits",termsReviewStatus:"pending"},
  {id:"googlePlaces",name:"Google Places",enabled:false,priority:3,capabilities:["Company discovery"],estimatedCost:"Provider quota",termsReviewStatus:"pending"},
  {id:"apollo",name:"Apollo",enabled:false,priority:4,capabilities:["Company and people search","Contact enrichment"],estimatedCost:"Plan credits",termsReviewStatus:"pending"},
  {id:"hunter",name:"Hunter",enabled:false,priority:5,capabilities:["Email finder","Email verification"],estimatedCost:"Plan credits",termsReviewStatus:"pending"},
  {id:"publicWeb",name:"Approved public web",enabled:false,priority:6,capabilities:["Public intent evidence"],estimatedCost:"Free",termsReviewStatus:"pending"},
]};
const configs=new Map<string,WorkspaceConfig>();
function copy(config:WorkspaceConfig):WorkspaceConfig{return {...config,services:[...config.services],providers:config.providers.map(item=>({...item,capabilities:[...item.capabilities]}))};}
export function getWorkspaceConfig(workspaceId:string){return copy(configs.get(workspaceId)??defaults);}
export function updateWorkspaceConfig(workspaceId:string,input:Partial<WorkspaceConfig>){const current=getWorkspaceConfig(workspaceId);const next:WorkspaceConfig={...current,...input,services:input.services?[...input.services]:current.services,providers:input.providers?input.providers.map((item,index)=>({...item,priority:index+1})):current.providers};configs.set(workspaceId,next);return copy(next);}
export function clearWorkspaceConfigsForTests(){configs.clear();}
