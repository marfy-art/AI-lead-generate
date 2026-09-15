import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {clearWorkspaceConfigsForTests,getWorkspaceConfig,updateWorkspaceConfig} from "../workspace-config";
import {providersForWorkspace} from "./providers";

beforeEach(clearWorkspaceConfigsForTests);
afterEach(()=>vi.unstubAllEnvs());
describe("workspace provider selection",()=>{
  it("keeps mock mode as the safe default",async()=>expect((await providersForWorkspace("w","company_search")).map(item=>item.name)).toEqual(["mock"]));
  it("honors approved provider enablement and ordering in live mode",async()=>{vi.stubEnv("MOCK_PROVIDERS","false");const config=getWorkspaceConfig("w");const providers=config.providers.map(item=>item.id==="openStreetMap"?{...item,enabled:true,termsReviewStatus:"approved" as const}:item.id==="googlePlaces"?{...item,enabled:true,termsReviewStatus:"approved" as const}:item);updateWorkspaceConfig("w",{mockMode:false,providers});expect((await providersForWorkspace("w","company_search")).map(item=>item.name)).toEqual(["openstreetmap","google_places"]);});
});
