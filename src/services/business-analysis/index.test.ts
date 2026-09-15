import { afterEach, describe, expect, it, vi } from "vitest";
import { analyzeBusiness } from ".";
import { addAiConfig, clearAiConfigsForTests } from "../ai-models";

describe("business analysis", () => {
  afterEach(() => { clearAiConfigsForTests(); vi.unstubAllGlobals(); });
  it("returns strict buyer and seller analysis in mock mode", async () => {
    const result = await analyzeBusiness({ input:"https://kriyakarak.com", goal:"both", selectedServices:["Photography"], geography:"Dhaka, Bangladesh" });
    expect(result.mode).toBe("mock");
    expect(result.marketplaceSides).toEqual(["buyer", "seller"]);
    expect(result.services[0].intentPhrases).toContain("ফটোগ্রাফার দরকার");
  });

  it("never invents unsupported service detail", async () => {
    const result = await analyzeBusiness({ input:"A local marketplace", goal:"sellers", selectedServices:["AC Repair"] });
    expect(result.services[0].name).toBe("AC Repair");
    expect(result.services[0].category).toBe("Local services");
  });

  it("uses the active workspace AI model without exposing its key", async () => {
    addAiConfig({workspaceId:"demo",name:"Primary",provider:"openai",baseUrl:"https://api.openai.com/v1",model:"gpt-test",apiKey:"secret-key",active:true});
    const live={businessSummary:"A marketplace",businessModel:"Marketplace",marketplaceSides:["buyer"],services:[{name:"Photography",category:"Creative",keywords:[],buyerPainPoints:[],buyerPersonas:[],sellerPersonas:[],intentPhrases:[],negativeKeywords:[]}],geographies:["Dhaka"],recommendedSources:["public_web"],assumptions:[],mode:"live"};
    const fetchMock=vi.fn().mockResolvedValue(new Response(JSON.stringify({output:[{content:[{type:"output_text",text:JSON.stringify(live)}]}]}),{status:200,headers:{"content-type":"application/json"}}));
    vi.stubGlobal("fetch",fetchMock);
    await expect(analyzeBusiness({input:"Marketplace",goal:"buyers"})).resolves.toMatchObject({mode:"live"});
    expect(fetchMock).toHaveBeenCalledWith("https://api.openai.com/v1/responses",expect.objectContaining({headers:expect.objectContaining({authorization:"Bearer secret-key"})}));
  });
});
