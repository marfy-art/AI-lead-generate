import {ApolloProvider} from "../../providers/apollo";
import {GooglePlacesProvider} from "../../providers/google-places";
import {HunterProvider} from "../../providers/hunter";
import {MockProvider} from "../../providers/mock";
import {OpenStreetMapProvider} from "../../providers/openstreetmap";
import type {Capability,EnrichmentProvider} from "../../providers/types";
import {getWorkspaceConfigPersistent} from "../persistence/workspace-config";

const factories:Record<string,()=>EnrichmentProvider>={
  googlePlaces:()=>new GooglePlacesProvider(),
  openStreetMap:()=>new OpenStreetMapProvider(),
  apollo:()=>new ApolloProvider(),
  hunter:()=>new HunterProvider(),
};

export async function providersForWorkspace(workspaceId:string,capability:Capability){
  const config=await getWorkspaceConfigPersistent(workspaceId);
  if(process.env.MOCK_PROVIDERS!=="false"||config.mockMode)return [new MockProvider()];
  return config.providers
    .filter(setting=>setting.id!=="mock"&&setting.enabled&&setting.termsReviewStatus!=="pending")
    .sort((a,b)=>a.priority-b.priority)
    .map(setting=>factories[setting.id]?.())
    .filter((provider):provider is EnrichmentProvider=>Boolean(provider&&provider.capabilities.includes(capability)));
}
