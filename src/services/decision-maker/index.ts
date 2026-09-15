export type CompanySize = "small" | "mid_large";
export type TargetRole = { role: string; priority: number; reason: string };

const roleMatrix: Record<string, Record<CompanySize, string[]>> = {
  "graphic design": { small:["Owner","Founder"], mid_large:["Brand Manager","Marketing Manager","Marketing Director"] },
  photography: { small:["Owner","General Manager"], mid_large:["Marketing Manager","Brand Manager","Event Manager"] },
  videography: { small:["Owner","Founder"], mid_large:["Marketing Manager","Content Manager","Brand Manager"] },
  "digital marketing": { small:["Owner","Founder"], mid_large:["Head of Marketing","Marketing Manager"] },
  "web development": { small:["Owner","Founder"], mid_large:["Head of Digital","Product Lead","Marketing Director","IT Lead"] },
  "event planning": { small:["Owner","Administrator"], mid_large:["Event Director","HR Manager","Marketing Manager","Operations Manager"] },
  tutoring: { small:["Parent or student contact"], mid_large:["Learning and Development Manager","Academic Administrator","HR Manager"] },
  "home services": { small:["Household or business contact"], mid_large:["Facilities Manager","Operations Manager","Administrator"] },
};

function normalizeService(value: string) {
  const normalized = value.trim().toLowerCase();
  return Object.keys(roleMatrix).find(key => normalized.includes(key) || key.includes(normalized)) ?? "graphic design";
}

export function recommendDecisionMakers(input: { service: string; companySize: CompanySize }) {
  const service = normalizeService(input.service);
  const roles = roleMatrix[service][input.companySize];
  const targetRoles: TargetRole[] = roles.map((role,index) => ({ role, priority:index+1, reason:`${role} is likely to combine problem ownership, budget influence, and reasonable accessibility for ${service} at a ${input.companySize === "small" ? "small" : "mid/large"} organization.` }));
  return { serviceCategory:service, targetRoles, avoidRoles:[{ role:"Receptionist or call-center agent", reason:"May route an inquiry but is not assumed to own the budget or service need." }], methodology:"Role recommendation only; a provider or public company source must confirm the actual person." };
}
