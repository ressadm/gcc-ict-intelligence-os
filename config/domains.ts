// Intelligence domains tracked by the GCC ICT Intelligence OS.
// Each domain has a stable ID (used in JSON briefs and URLs) and a label.
// Edit this file to add/remove domains. Briefs validate domain IDs against this list.

export type DomainId =
  | 'telco-b2b'
  | 'it-services'
  | 'cybersecurity'
  | 'cloud-ai-hyperscalers'
  | 'enterprise-apps'
  | 'cloud-prof-services'
  | 'bpo-gbs'
  | 'startups-vc'
  | 'gov-regulation-megaprojects'
  | 'geopolitics-sovereignty';

export interface Domain {
  id: DomainId;
  label: string;
  short: string;
}

export const DOMAINS: Domain[] = [
  { id: 'telco-b2b', label: 'Telco B2B', short: 'Telco' },
  { id: 'it-services', label: 'IT Services, SI & Consulting', short: 'IT Services' },
  { id: 'cybersecurity', label: 'Cybersecurity', short: 'Cyber' },
  { id: 'cloud-ai-hyperscalers', label: 'Cloud, AI Platforms & Hyperscalers', short: 'Cloud/AI' },
  { id: 'enterprise-apps', label: 'Enterprise Apps & Digital Services', short: 'Apps' },
  { id: 'cloud-prof-services', label: 'Cloud Prof. Services & App Modernisation', short: 'Cloud PS' },
  { id: 'bpo-gbs', label: 'BPO & GBS', short: 'BPO/GBS' },
  { id: 'startups-vc', label: 'Startups & VC', short: 'Startups' },
  { id: 'gov-regulation-megaprojects', label: 'Government, Regulation & Mega Projects', short: 'Gov' },
  { id: 'geopolitics-sovereignty', label: 'Geopolitics & Sovereignty', short: 'Geo' },
];

export const DOMAIN_IDS = DOMAINS.map((d) => d.id) as [DomainId, ...DomainId[]];

export function domainLabel(id: string): string {
  return DOMAINS.find((d) => d.id === id)?.label ?? id;
}
