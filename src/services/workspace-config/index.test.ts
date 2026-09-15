import {beforeEach,describe,expect,it} from "vitest";
import {clearWorkspaceConfigsForTests,getWorkspaceConfig,updateWorkspaceConfig} from ".";
beforeEach(clearWorkspaceConfigsForTests);
describe("workspace config",()=>{it("persists thresholds and normalizes provider priority",()=>{const config=getWorkspaceConfig("w");const reversed=[...config.providers].reverse();const saved=updateWorkspaceConfig("w",{leadThreshold:82,providers:reversed});expect(saved.leadThreshold).toBe(82);expect(saved.providers.map(item=>item.priority)).toEqual(saved.providers.map((_,index)=>index+1));});});
