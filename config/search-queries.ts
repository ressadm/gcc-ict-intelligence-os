// Discovery queries fed to Perplexity Sonar for the weekly sweep.
// Keep queries short and single-intent for better retrieval quality.

import type { DomainId } from './domains';

export interface DiscoveryQuery {
  id: string;
  domain: DomainId;
  query: string;
}

export const DISCOVERY_QUERIES: DiscoveryQuery[] = [
  // Telco B2B
  { id: 'telco-1', domain: 'telco-b2b', query: 'stc enterprise Saudi week' },
  { id: 'telco-2', domain: 'telco-b2b', query: 'e& enterprise UAE week' },
  { id: 'telco-3', domain: 'telco-b2b', query: 'Ooredoo Zain enterprise GCC week' },
  { id: 'telco-4', domain: 'telco-b2b', query: 'private 5G GCC enterprise week' },

  // IT Services / SI / Consulting
  { id: 'it-1', domain: 'it-services', query: 'Saudi IT services contract week' },
  { id: 'it-2', domain: 'it-services', query: 'UAE system integrator deal week' },
  { id: 'it-3', domain: 'it-services', query: 'Accenture TCS Infosys Wipro GCC week' },
  { id: 'it-4', domain: 'it-services', query: 'Ejada SITE Elm GBM Injazat week' },

  // Cybersecurity
  { id: 'cyber-1', domain: 'cybersecurity', query: 'Saudi cybersecurity regulation week' },
  { id: 'cyber-2', domain: 'cybersecurity', query: 'UAE cyber council directive week' },
  { id: 'cyber-3', domain: 'cybersecurity', query: 'GCC MSSP SOC contract week' },
  { id: 'cyber-4', domain: 'cybersecurity', query: 'OT cybersecurity GCC energy week' },

  // Cloud / AI / Hyperscalers
  { id: 'cloud-1', domain: 'cloud-ai-hyperscalers', query: 'AWS Saudi UAE week' },
  { id: 'cloud-2', domain: 'cloud-ai-hyperscalers', query: 'Azure Oracle Google Cloud GCC week' },
  { id: 'cloud-3', domain: 'cloud-ai-hyperscalers', query: 'G42 Core42 HUMAIN AI GCC week' },
  { id: 'cloud-4', domain: 'cloud-ai-hyperscalers', query: 'Nvidia GPU GCC AI week' },

  // Enterprise Apps & Digital Services
  { id: 'apps-1', domain: 'enterprise-apps', query: 'SAP Oracle Salesforce GCC week' },
  { id: 'apps-2', domain: 'enterprise-apps', query: 'Microsoft Dynamics ServiceNow GCC week' },
  { id: 'apps-3', domain: 'enterprise-apps', query: 'enterprise AI agent GCC week' },

  // Cloud Professional Services & App Modernisation
  { id: 'cps-1', domain: 'cloud-prof-services', query: 'cloud migration GCC contract week' },
  { id: 'cps-2', domain: 'cloud-prof-services', query: 'application modernisation Saudi UAE week' },

  // BPO & GBS
  { id: 'bpo-1', domain: 'bpo-gbs', query: 'GBS Saudi UAE week' },
  { id: 'bpo-2', domain: 'bpo-gbs', query: 'BPO AI contact center GCC week' },

  // Startups & VC
  { id: 'svc-1', domain: 'startups-vc', query: 'GCC ICT funding week' },
  { id: 'svc-2', domain: 'startups-vc', query: 'Saudi UAE AI cyber startup week' },

  // Government, Regulation, Mega Projects
  { id: 'gov-1', domain: 'gov-regulation-megaprojects', query: 'Saudi digital infrastructure tender week' },
  { id: 'gov-2', domain: 'gov-regulation-megaprojects', query: 'TDRA CST NCA SDAIA week' },
  { id: 'gov-3', domain: 'gov-regulation-megaprojects', query: 'NEOM digital Saudi week' },
  { id: 'gov-4', domain: 'gov-regulation-megaprojects', query: 'Qatar Bahrain Kuwait Oman digital government week' },

  // Geopolitics & Sovereignty
  { id: 'geo-1', domain: 'geopolitics-sovereignty', query: 'chip export control GCC AI week' },
  { id: 'geo-2', domain: 'geopolitics-sovereignty', query: 'Huawei GCC telecom cloud week' },
];
