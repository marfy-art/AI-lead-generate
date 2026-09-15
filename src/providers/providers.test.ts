import { afterEach, describe, expect, it, vi } from "vitest";
import { GooglePlacesProvider } from "./google-places";
import { HunterProvider } from "./hunter";
import { ApolloProvider } from "./apollo";
import {OpenStreetMapProvider,resetOpenStreetMapProviderForTests} from "./openstreetmap";

afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();resetOpenStreetMapProviderForTests();});

describe("live provider adapters",()=>{
  it("keeps Google Places disabled without a key",async()=>expect(await new GooglePlacesProvider().canRun({capability:"company_search",projectId:"p",leadId:"l"})).toBe(false));
  it("uses the Places v1 text-search field mask",async()=>{
    vi.stubEnv("GOOGLE_MAPS_API_KEY","secret");
    const fetchMock=vi.fn().mockResolvedValue(new Response(JSON.stringify({places:[{id:"place-1",displayName:{text:"Cafe"}}]}),{status:200,headers:{"content-type":"application/json"}}));
    vi.stubGlobal("fetch",fetchMock);
    const result=await new GooglePlacesProvider().enrich({capability:"company_search",projectId:"p",leadId:"l",companyName:"Cafe Dhaka"});
    expect(result).toMatchObject({success:true,providerRecordId:"place-1",costUnits:1});
    const [,init]=fetchMock.mock.calls[0];
    expect(init.headers["X-Goog-Api-Key"]).toBe("secret");
    expect(init.headers["X-Goog-FieldMask"]).toContain("places.id");
  });
  it("sends Hunter credentials in a header, not the URL",async()=>{
    vi.stubEnv("HUNTER_API_KEY","secret");
    const fetchMock=vi.fn().mockResolvedValue(new Response(JSON.stringify({data:{email:"person@example.com"}}),{status:200}));
    vi.stubGlobal("fetch",fetchMock);
    const result=await new HunterProvider().enrich({capability:"email_find",projectId:"p",leadId:"l",domain:"example.com",personName:"Test Person"});
    expect(result.success).toBe(true);
    const [url,init]=fetchMock.mock.calls[0];
    expect(url).not.toContain("secret");
    expect(init.headers["X-API-KEY"]).toBe("secret");
  });
  it("keeps Apollo phone reveal off during person enrichment",async()=>{
    vi.stubEnv("APOLLO_API_KEY","secret");
    const fetchMock=vi.fn().mockResolvedValue(new Response(JSON.stringify({person:{id:"p1"},match_confidence:"high"}),{status:200}));
    vi.stubGlobal("fetch",fetchMock);
    const result=await new ApolloProvider().enrich({capability:"person_enrichment",projectId:"p",leadId:"l",personName:"Test Person",domain:"example.com"});
    expect(result).toMatchObject({success:true,confidence:.95,costUnits:1});
    const [url,init]=fetchMock.mock.calls[0];
    expect(url).toContain("reveal_phone_number=false");
    expect(init.headers["x-api-key"]).toBe("secret");
  });
  it("uses an identified, cached, zero-cost OpenStreetMap lookup",async()=>{
    vi.stubEnv("ENABLE_NOMINATIM","true");
    vi.stubEnv("NOMINATIM_USER_AGENT","SignalDesk-Test/1.0 (+https://example.com/contact)");
    const fetchMock=vi.fn().mockResolvedValue(new Response(JSON.stringify([{place_id:1,osm_type:"node",osm_id:42,display_name:"Cafe Dhaka, Bangladesh",name:"Cafe Dhaka",category:"amenity",type:"cafe",importance:.8,lat:"23.8",lon:"90.4",extratags:{website:"https://cafe.example"}}]),{status:200}));
    vi.stubGlobal("fetch",fetchMock);
    const provider=new OpenStreetMapProvider();
    const input={capability:"company_search" as const,projectId:"p",leadId:"l",companyName:"Cafe Dhaka"};
    const first=await provider.enrich(input);
    const second=await provider.enrich(input);
    expect(first).toMatchObject({success:true,confidence:.8,costUnits:0,data:[{id:"node-42",attribution:"© OpenStreetMap contributors"}]});
    expect(second).toEqual(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url,init]=fetchMock.mock.calls[0];
    expect(url).toContain("format=jsonv2");
    expect(init.headers["user-agent"]).toContain("SignalDesk-Test");
  });
});
