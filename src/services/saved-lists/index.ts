export type SavedList={id:string;workspaceId:string;name:string;rule:string;count:number;createdAt:string;system:boolean};
const records=new Map<string,SavedList>();
const seeded=new Set<string>();
function seed(workspaceId:string){if(seeded.has(workspaceId))return;seeded.add(workspaceId);[["High-intent buyers","Explicit intent · score 80+",46],["Outreach-ready","Verified channel · not suppressed",112],["Dhaka creative sellers","Seller fit 70+ · Dhaka",73],["Needs evidence review","Confidence below 65",31]].forEach(([name,rule,count])=>{const item:SavedList={id:crypto.randomUUID(),workspaceId,name:String(name),rule:String(rule),count:Number(count),createdAt:new Date().toISOString(),system:true};records.set(item.id,item);});}
export function listSavedLists(workspaceId:string){seed(workspaceId);return [...records.values()].filter(item=>item.workspaceId===workspaceId);}
export function addSavedList(input:{workspaceId:string;name:string;rule:string}){const item:SavedList={...input,id:crypto.randomUUID(),count:0,createdAt:new Date().toISOString(),system:false};records.set(item.id,item);return item;}
export function removeSavedList(workspaceId:string,id:string){const item=records.get(id);return Boolean(item&&item.workspaceId===workspaceId&&!item.system&&records.delete(id));}
export function clearSavedListsForTests(){records.clear();seeded.clear();}
