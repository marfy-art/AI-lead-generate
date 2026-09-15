import { beforeEach,describe,expect,it } from "vitest";
import { addSuppression,isSuppressed,listSuppressions,removeSuppression } from ".";

beforeEach(()=>listSuppressions("test").forEach(entry=>removeSuppression("test",entry.id)));
describe("suppression store",()=>{
  it("normalizes and matches email without exposing it in listings",()=>{addSuppression({workspaceId:"test",type:"email",value:" Person@Example.com "});expect(isSuppressed({workspaceId:"test",type:"email",value:"person@example.com"})).toBe(true);expect(listSuppressions("test")[0]).not.toHaveProperty("hash");expect(listSuppressions("test")[0].label).toBe("pe***@example.com");});
  it("is idempotent and removable",()=>{const a=addSuppression({workspaceId:"test",type:"domain",value:"https://www.example.com"});const b=addSuppression({workspaceId:"test",type:"domain",value:"example.com"});expect(a.id).toBe(b.id);expect(removeSuppression("test",a.id)).toBe(true);});
});
