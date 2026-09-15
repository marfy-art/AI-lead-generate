export type OutreachEvidence = { id: string; text: string; type: "observed"|"provider_data"|"inference" };
export type OutreachInput = {
  companyName: string;
  personName?: string | null;
  service: string;
  intentStatus: "explicit"|"inferred"|"fit";
  evidence: OutreachEvidence[];
  channels: { verifiedWorkEmail?: boolean; directBusinessPhone?: boolean; professionalSocial?: boolean; businessMessaging?: boolean };
  suppressed?: boolean;
};

function selectChannel(input: OutreachInput) {
  if (input.suppressed) return { channel:"none" as const, reason:"The lead is suppressed; no outreach should be prepared." };
  if (input.intentStatus === "explicit" && input.channels.directBusinessPhone) return { channel:"phone" as const, reason:"A direct business number is available and the need is explicit." };
  if (input.channels.verifiedWorkEmail) return { channel:"email" as const, reason:"A verified work email is available for personalized B2B outreach." };
  if (input.channels.professionalSocial) return { channel:"social" as const, reason:"A professional social channel is available and no verified work email is present." };
  if (input.channels.businessMessaging) return { channel:"message" as const, reason:"A legitimate business messaging channel is available." };
  return { channel:"none" as const, reason:"No verified direct or professional contact channel is available." };
}

export function findUnsupportedClaims(message: string, input: Pick<OutreachInput,"intentStatus"|"evidence">) {
  const unsupported: string[] = [];
  if (input.intentStatus !== "explicit" && /\b(?:you|your (?:team|company|business)) (?:needs?|are looking for|requested)\b/i.test(message)) unsupported.push("The draft states an inferred need as confirmed.");
  if (!input.evidence.length && /\b(?:saw|noticed|congratulations on|following)\b/i.test(message)) unsupported.push("The draft references context without stored evidence.");
  return unsupported;
}

export function generateOutreachDraft(input: OutreachInput) {
  const recommendation = selectChannel(input);
  if (recommendation.channel === "none") return { recommendedChannel:"none" as const, channelReason:recommendation.reason, subject:"", message:"", callOpener:"", followUp:"", evidenceIdsUsed:[], unsupportedClaimsDetected:[] };
  const evidence = input.evidence[0];
  const greeting = input.personName ? `Hi ${input.personName},` : "Hello,";
  const explicitAngle = evidence ? `I came across your public request: “${evidence.text.slice(0,160)}”` : `I understand ${input.companyName} is exploring ${input.service.toLowerCase()} support.`;
  const inferredAngle = evidence ? `I noticed this update from ${input.companyName}: “${evidence.text.slice(0,160)}”` : `${input.companyName} looks relevant to local ${input.service.toLowerCase()} professionals.`;
  const angle = input.intentStatus === "explicit" ? explicitAngle : inferredAngle;
  const message = `${greeting}\n\n${angle}. Kriyakarak can help you review suitable local ${input.service.toLowerCase()} professionals without assuming a requirement that you have not confirmed.\n\nWould a short, curated shortlist be useful?`;
  const draft = { recommendedChannel:recommendation.channel, channelReason:recommendation.reason, subject:`Local ${input.service} options for ${input.companyName}`, message, callOpener:`Hello, I’m calling about ${input.companyName}'s public update and whether a curated ${input.service.toLowerCase()} shortlist would be useful.`, followUp:`Just following up—happy to share a short list of relevant local ${input.service.toLowerCase()} professionals if helpful.`, evidenceIdsUsed:evidence?[evidence.id]:[], unsupportedClaimsDetected:findUnsupportedClaims(message,input) };
  return draft;
}
