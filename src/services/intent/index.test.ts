import { describe, expect, it } from "vitest";
import { classifyIntent } from ".";

describe("intent classification", () => {
  it("marks a current explicit service request", () => expect(classifyIntent({ text:"Looking for a photographer for our launch", serviceKeywords:["photographer"], publishedAt:new Date().toISOString() })).toMatchObject({ intentType:"explicit", intentScore:95, rejectedAsNegative:false }));
  it("labels a commercial trigger as inferred", () => expect(classifyIntent({ text:"We are opening a new branch", serviceKeywords:["photography"], publishedAt:new Date().toISOString() })).toMatchObject({ intentType:"commercial_signal", explicitOrInferred:"inferred" }));
  it("rejects employment content", () => expect(classifyIntent({ text:"Full-time photographer job", serviceKeywords:["photographer"] })).toMatchObject({ intentType:"none", rejectedAsNegative:true }));
  it("supports Bangla explicit language", () => expect(classifyIntent({ text:"আমাদের একজন ডিজাইনার দরকার", serviceKeywords:["ডিজাইনার"], publishedAt:new Date().toISOString() }).intentType).toBe("explicit"));
  it("matches a profession alias to its service category", () => expect(classifyIntent({ text:"Looking for a local designer", serviceKeywords:["Graphic Design"], publishedAt:new Date().toISOString() })).toMatchObject({serviceMatch:true,intentType:"explicit"}));
});
