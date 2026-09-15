import {beforeEach,describe,expect,it} from "vitest";
import {clearJobsForTests,createJob,getJob,runJob} from ".";
beforeEach(clearJobsForTests);
describe("job runner",()=>{it("retries a transient failure and stores the result",async()=>{const job=createJob("p","discovery");let calls=0;const result=await runJob(job.id,async()=>{calls++;if(calls===1)throw new Error("temporary");return {found:3};});expect(result).toMatchObject({status:"completed",attempts:2,result:{found:3}});});it("stops immediately for a non-retryable error",async()=>{const job=createJob("p","discovery");await runJob(job.id,async()=>{throw new Error("invalid");},{retryable:()=>false});expect(getJob(job.id)).toMatchObject({status:"failed",attempts:1,error:"invalid"});});});
