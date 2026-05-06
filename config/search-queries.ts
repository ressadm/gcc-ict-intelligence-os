// Discovery queries fed to Perplexity Sonar (sonar-pro) for the last-48h sweep.
// These are intentionally short keyword phrases — Sonar performs better with
// keyword queries than long natural-language questions. Edit freely.

import type { DomainId } from './domains';

export interface DiscoveryQuery {
  id: string;
  domain: DomainId;
  query: string;
}

export const DISCOVERY_QUERIES: DiscoveryQuery[] = [
  // Telco B2B
  { id: 'telco-1', domain: 'telco-b2b', query: 'GCC telco B2B enterprise contract Saudi UAE Qatar last 48 hours' },
  { id: 'telco-2', domain: 'telco-b2b', query: 'stc Etisalat e& du Ooredoo Zain enterprise deal announcement' },
  { id: 'telco-3', domain: 'telco-b2b', query: 'Middle East private 5G network enterprise deployment' },

  // IT Services / SI / Consulting
  { id: 'it-1', domain: 'it-services', query: 'Saudi Arabia UAE IT services system integration contract win' },
  { id: 'it-2', domain: 'it-services', query: 'GCC consulting firm Accenture Deloitte PwC McKinsey Middle East deal' },
  { id: 'it-3', domain: 'it-services', query: 'Tata Consultancy Infosys Wipro HCL GCC nearshore delivery' },

  // Cybersecurity
  { id: 'cyber-1', domain: 'cybersecurity', query: 'GCC cybersecurity breach incident regulation Saudi UAE' },
  { id: 'cyber-2', domain: 'cybersecurity', query: 'Middle East SOC managed security services contract' },
  { id: 'cyber-3', domain: 'cybersecurity', query: 'NCA SDAIA UAE Cyber Security Council directive' },

  // Cloud / AI / Hyperscalers
  { id: 'cloud-1', domain: 'cloud-ai-hyperscalers', query: 'AWS Azure Google Cloud Oracle Saudi UAE region launch' },
  { id: 'cloud-2', domain: 'cloud-ai-hyperscalers', query: 'GCC sovereign cloud AI data centre investment announcement' },
  { id: 'cloud-3', domain: 'cloud-ai-hyperscalers', query: 'HUMAIN G42 Core42 Saudi UAE AI deal' },
  { id: 'cloud-4', domain: 'cloud-ai-hyperscalers', query: 'Nvidia GPU GCC Saudi UAE supply agreement' },

  // Enterprise Apps & Digital Services
  { id: 'apps-1', domain: 'enterprise-apps', query: 'GCC SAP Oracle Salesforce Microsoft Dynamics enterprise deal' },
  { id: 'apps-2', domain: 'enterprise-apps', query: 'Middle East AI agent enterprise software deployment' },

  // Cloud Professional Services & Application Modernisation
  { id: 'cps-1', domain: 'cloud-prof-services', query: 'GCC application modernisation cloud migration contract' },
  { id: 'cps-2', domain: 'cloud-prof-services', query: 'Saudi UAE legacy mainframe transformation programme' },

  // BPO & GBS
  { id: 'bpo-1', domain: 'bpo-gbs', query: 'GCC GBS global business services centre Saudi UAE Egypt' },
  { id: 'bpo-2', domain: 'bpo-gbs', query: 'Middle East BPO contact centre AI deployment contract' },

  // Startups & VC
  { id: 'svc-1', domain: 'startups-vc', query: 'GCC ICT startup funding round Saudi UAE last week' },
  { id: 'svc-2', domain: 'startups-vc', query: 'Middle East AI cyber SaaS startup Series funding' },

  // Government, Regulation, Mega Projects
  { id: 'gov-1', domain: 'gov-regulation-megaprojects', query: 'Vision 2030 NEOM Saudi Arabia ICT digital infrastructure tender' },
  { id: 'gov-2', domain: 'gov-regulation-megaprojects', query: 'UAE Operation 300bn TDRA CITC GCC regulation telecom' },
  { id: 'gov-3', domain: 'gov-regulation-megaprojects', query: 'Qatar Bahrain Kuwait Oman digital government programme contract' },

  // Geopolitics & Sovereignty
  { id: 'geo-1', domain: 'geopolitics-sovereignty', query: 'US chip export control GCC AI sovereignty Saudi UAE' },
  { id: 'geo-2', domain: 'geopolitics-sovereignty', query: 'China Huawei GCC Middle East telecom infrastructure' },
];
