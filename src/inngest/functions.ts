import {inngest} from "./client";
import {discoverMockCandidates} from "../services/discovery";
import {runJobPersistent} from "../services/persistence/jobs";

type DiscoveryEvent={jobId:string;projectId:string;side:"buyer"|"seller"|"both";services:string[];geography:string};

export const discoveryJobFunction=inngest.createFunction(
  {id:"signaldesk-discovery",retries:3,triggers:{event:"signaldesk/discovery.requested"}},
  async ({event,step})=>{
    const data=event.data as DiscoveryEvent;
    return step.run("discover-candidates",()=>runJobPersistent(data.jobId,()=>discoverMockCandidates({projectId:data.projectId,side:data.side,services:data.services,geography:data.geography}),1));
  },
);
