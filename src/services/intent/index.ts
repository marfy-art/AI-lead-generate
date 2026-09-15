const explicitPatterns = [/\blooking for\b/i,/\bneed(?:ing)?\b/i,/\bseeking\b/i,/\brecommend (?:a|an)\b/i,/দরকার/u,/খুঁজছি/u];
const commercialPatterns = [/\bopening\b/i,/\blaunch(?:ing)?\b/i,/\bexpansion\b/i,/\brebrand(?:ing)?\b/i,/\bupcoming event\b/i,/নতুন শাখা/u];
const negativePatterns = [/\bfull[- ]?time\b/i,/\bpermanent (?:job|role|position)\b/i,/\bcourse\b/i,/\btutorial\b/i,/চাকরি/u];
const serviceAliases: Record<string,string[]> = {
  "graphic design":["graphic design","designer","design support"],
  photography:["photography","photographer","photo shoot","photoshoot"],
  videography:["videography","videographer","video production"],
  "digital marketing":["digital marketing","marketer","social media marketing"],
  "web development":["web development","web developer","website development","website redesign"],
  tutoring:["tutoring","tutor","teacher"],
};

function matchesService(text: string, keywords: string[]) {
  const normalizedText = text.toLowerCase();
  return keywords.some(keyword => {
    const normalizedKeyword = keyword.toLowerCase();
    const aliases = serviceAliases[normalizedKeyword] ?? [normalizedKeyword];
    return aliases.some(alias => normalizedText.includes(alias));
  });
}

export function classifyIntent(input: { text: string; serviceKeywords: string[]; publishedAt?: string | null }) {
  const negative = negativePatterns.some(pattern=>pattern.test(input.text));
  const serviceMatch = matchesService(input.text,input.serviceKeywords);
  const explicit = explicitPatterns.some(pattern=>pattern.test(input.text));
  const commercial = commercialPatterns.some(pattern=>pattern.test(input.text));
  const ageDays = input.publishedAt ? Math.max(0,(Date.now()-new Date(input.publishedAt).getTime())/86_400_000) : null;
  const recencyScore = ageDays===null?40:ageDays<=7?100:ageDays<=30?80:ageDays<=90?55:ageDays<=180?30:10;
  let intentType: "explicit"|"commercial_signal"|"inferred"|"none" = "none";
  let intentScore = 0;
  if (!negative && serviceMatch && explicit) { intentType="explicit"; intentScore=95; }
  else if (!negative && commercial) { intentType="commercial_signal"; intentScore=75; }
  else if (!negative && serviceMatch) { intentType="inferred"; intentScore=55; }
  return { serviceMatch, intentType, intentScore:Math.round(intentScore*(recencyScore/100)), recencyScore, rejectedAsNegative:negative, explicitOrInferred:intentType==="explicit"?"explicit" as const:intentType==="none"?"none" as const:"inferred" as const, reasoningSummary:negative?"Rejected because the text resembles employment, training, or tutorial content.":intentType==="explicit"?"A current service need is explicitly stated.":intentType==="commercial_signal"?"A commercial trigger suggests possible service demand; the need is not confirmed.":intentType==="inferred"?"The service matches, but no explicit request is present.":"No qualifying intent signal was found." };
}
