import {beforeEach,describe,expect,it} from "vitest";
import {addSavedList,clearSavedListsForTests,listSavedLists,removeSavedList} from ".";
beforeEach(clearSavedListsForTests);
describe("saved lists",()=>{it("creates and removes user lists without deleting system views",()=>{const list=addSavedList({workspaceId:"w",name:"Review",rule:"score < 70"});expect(listSavedLists("w")).toContainEqual(list);expect(removeSavedList("w",list.id)).toBe(true);const system=listSavedLists("w")[0];expect(removeSavedList("w",system.id)).toBe(false);});});
