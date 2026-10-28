/**
 * Veryfi AI — Baseline State & Blueprint Reference Data
 * 
 * In accordance with Data Integrity standards:
 * - Active customer records and audit history start EMPTY.
 * - No fake live metrics, compliance scores, or approval decisions are preloaded.
 * - Blueprint reference items are explicitly isolated and labeled as static design references.
 */

import { AuditItem, BrandColor, GuidelineCategory, TypographySpec, WorkspaceSettings } from '../types';

/**
 * Active Audits: Default empty state for genuine user audits.
 */
export const INITIAL_AUDITS: AuditItem[] = [];

/**
 * Default Workspace Configuration (Unconfigured until user specifies in Settings)
 */
export const INITIAL_SETTINGS: WorkspaceSettings = {
  workspaceName: '',
  industry: 'Technology & Digital Services',
  logoUrl: '',
  primaryColor: '#7C3AED',
  secondaryColor: '#C4B5FD',
  brandFont: 'Inter (Sans-Serif)',
  rules: {
    brandConsistency: true,
    factChecking: true,
    claimsCompliance: true,
    accessibility: false
  }
};

/**
 * Default semantic brand color token slots (ready for user customization)
 */
export const DEFAULT_BRAND_COLORS: BrandColor[] = [
  { name: 'Primary', hex: '#7C3AED', role: 'Primary Brand Identifier' },
  { name: 'Secondary', hex: '#C4B5FD', role: 'Secondary Accents & Highlights' },
  { name: 'Background', hex: '#0A0D18', role: 'Surface & Canvas Backdrop' },
  { name: 'Surface', hex: '#121727', role: 'Elevated Container Background' },
  { name: 'Text', hex: '#F8FAFC', role: 'Primary High-Contrast Copy' }
];

/**
 * Default Typography Configuration
 */
export const DEFAULT_TYPOGRAPHY: TypographySpec[] = [
  {
    fontFamily: 'Inter',
    weight: 'SemiBold (600)',
    usage: 'Headings & Display Typography'
  },
  {
    fontFamily: 'Inter',
    weight: 'Regular (400)',
    usage: 'Body, Paragraphs & Interface Labels'
  }
];

/**
 * Standard Baseline Brand Governance Taxonomy
 * Provides standard governance rules across 8 key compliance categories.
 */
export const BASELINE_GUIDELINES: GuidelineCategory[] = [
  {
    id: 'voice-and-tone',
    title: 'Brand Voice & Tone',
    description: 'Establishes the communicative voice, tone, and character across customer-facing communications.',
    iconName: 'Megaphone',
    attributes: ['Professional', 'Clear', 'Helpful', 'Transparent'],
    dos: [
      'Use direct, concise, and accessible vocabulary.',
      'Maintain an encouraging, solution-oriented tone.',
      'Ensure brand claims are transparent and substantiate claims with facts.'
    ],
    donts: [
      'Avoid unverified superlatives or exaggerated guarantees.',
      'Do not use high-pressure, aggressive, or deceptive sales language.',
      'Never omit legally mandated regulatory disclaimers.'
    ],
    examples: {
      onBrand: '“Empowering teams with clear, verifiable brand governance.”',
      offBrand: '“Guaranteed 1000% instant conversions overnight with zero effort!”'
    }
  },
  {
    id: 'messaging',
    title: 'Messaging & Positioning',
    description: 'Core value propositions, audience pillars, and market positioning statements.',
    iconName: 'Target',
    attributes: ['Purpose-Driven', 'Accurate', 'Value-Focused'],
    dos: [
      'Anchor messaging in demonstrable product capabilities.',
      'Address customer pain points with clarity and empathy.',
      'Highlight concrete compliance and security standards.'
    ],
    donts: [
      'Do not make unsubstantiated competitive disparagements.',
      'Avoid vague or hollow buzzwords without substance.',
      'Never misstate certified regulatory compliance levels.'
    ],
    examples: {
      onBrand: '“Enterprise-grade brand governance built for modern distributed teams.”',
      offBrand: '“The one and only product in the universe that can do anything.”'
    }
  },
  {
    id: 'visual-identity',
    title: 'Visual Identity',
    description: 'Aesthetic moodboards, layout structures, spacing grids, and graphic treatments.',
    iconName: 'Palette',
    attributes: ['Harmonious', 'Modern', 'Spacious', 'Consistent'],
    dos: [
      'Maintain generous negative space (padding/margins) around hero content.',
      'Use uniform corner radiuses (8px–24px) for cards and UI components.',
      'Ensure clear visual hierarchy from H1 through body text.'
    ],
    donts: [
      'Do not crowd elements or overlap text over complex, high-noise imagery.',
      'Avoid using unapproved drop-shadows or jarring color combinations.',
      'Never stretch, distort, or squash visual assets.'
    ],
    examples: {
      onBrand: '“Generous padding with clean dark surface cards and subtle borders.”',
      offBrand: '“Heavily compressed raster images with low-contrast neon text overlay.”'
    }
  },
  {
    id: 'typography',
    title: 'Typography',
    description: 'Font hierarchies, sizing scales, line heights, and typographic weights.',
    iconName: 'Type',
    attributes: ['Structured', 'Legible', 'Hierarchical'],
    dos: [
      'Use approved brand font families for all headlines and marketing collateral.',
      'Set body line height to at least 1.5x font size for comfortable reading.',
      'Maintain sufficient weight contrast between headings and body copy.'
    ],
    donts: [
      'Never substitute unapproved third-party display fonts without brand committee sign-off.',
      'Avoid font sizes below 11px on digital screen creatives.',
      'Do not use ultra-thin font weights on low-contrast backgrounds.'
    ],
    examples: {
      onBrand: '“SemiBold 24px headings with Regular 14px body text.”',
      offBrand: '“Multiple conflicting decorative script fonts in a single banner.”'
    }
  },
  {
    id: 'colours',
    title: 'Colour Usage',
    description: 'Palette codes, tint variations, gradient ratios, and background pairings.',
    iconName: 'Droplet',
    attributes: ['Calibrated', 'Consistent', 'Accessible'],
    dos: [
      'Anchor UI in primary brand purple (#7C3AED) with high-contrast surfaces.',
      'Use emerald (#10B981) strictly for verified positive/success states.',
      'Ensure background and text combinations exceed WCAG AA 4.5:1 ratio.'
    ],
    donts: [
      'Never introduce random, uncalibrated hex colors outside the design kit.',
      'Do not use warning amber or error red for non-critical decorative elements.',
      'Avoid low-contrast gray text on dark tinted surfaces.'
    ],
    examples: {
      onBrand: '“Primary purple CTA on dark navy surface with white text.”',
      offBrand: '“Bright yellow text directly over a light lavender card.”'
    }
  },
  {
    id: 'logo-usage',
    title: 'Logo & Asset Usage',
    description: 'Clear space boundaries, minimum sizing, and unapproved modifications.',
    iconName: 'Image',
    attributes: ['Protected', 'Standardized', 'Proportional'],
    dos: [
      'Maintain clear margin equal to at least 1x the logo mark height on all sides.',
      'Use inverse (white/light) logo on dark surfaces and dark logo on light surfaces.',
      'Preserve the original aspect ratio when scaling logo vectors.'
    ],
    donts: [
      'Never rotate, shear, or skew the brand emblem.',
      'Do not alter the relative spacing between brand mark and wordmark.',
      'Never place the logo over busy photographic textures without a backing scrim.'
    ],
    examples: {
      onBrand: '“Logo placed with 32px clear margin on solid dark header.”',
      offBrand: '“Logo recolored with rainbow gradient and tilted at 45 degrees.”'
    }
  },
  {
    id: 'claims',
    title: 'Claims & Compliance',
    description: 'Regulatory standards, healthcare claims, disclaimers, and legal verification.',
    iconName: 'ShieldCheck',
    attributes: ['Substantiated', 'Transparent', 'Compliant'],
    dos: [
      'Ensure all performance and capability metrics are substantiated by documented tests.',
      'Include legally required copyright, trademark, and jurisdiction disclaimers.',
      'Qualify subjective statements with factual context.'
    ],
    donts: [
      'Never present future roadmap concepts as currently certified features.',
      'Do not publish unverified customer endorsements or fabricated metrics.',
      'Never hide mandatory legal disclosures in unreadable microscopic text.'
    ],
    examples: {
      onBrand: '“Clinically tested compliance verification matching ISO 27001 standards.”',
      offBrand: '“100% cure rate guaranteed forever with no disclaimers.”'
    }
  },
  {
    id: 'accessibility',
    title: 'Accessibility (WCAG AA)',
    description: 'WCAG 2.1 AA standards, alt text, screen reader tags, and contrast rules.',
    iconName: 'Accessibility',
    attributes: ['Inclusive', 'Accessible', 'Readable'],
    dos: [
      'Maintain at least 4.5:1 contrast for regular text and 3:1 for large display headers.',
      'Provide concise, descriptive alternative text (alt text) for all raster imagery.',
      'Ensure all interactive controls have clearly visible keyboard focus rings.'
    ],
    donts: [
      'Never rely exclusively on color to convey critical error or status information.',
      'Avoid text burned into bitmap images without accessible HTML captions.',
      'Do not disable browser focus indicators without custom replacement styling.'
    ],
    examples: {
      onBrand: '“Text contrast 7.1:1 on #121727 card with aria-labels on action buttons.”',
      offBrand: '“Light gray text (#777777) on dark gray background with no focus indicators.”'
    }
  }
];

/**
 * STATIC DESIGN BLUEPRINT REFERENCE ONLY
 * Sourced from resources/verify audit.png to permit visual reference layout comparison.
 * Clearly identified as a static reference mockup, NOT active customer data.
 */
export const DESIGN_BLUEPRINT_REFERENCE = {
  isDesignReference: true,
  label: 'Design Reference Blueprint (Reference Spec Only — Not Active Audit)',
  artwork: {
    clinicName: 'BeingHeals',
    clinicSubtitle: 'Wellness & Aesthetic Clinic',
    treatment: 'Cryolipolysis',
    treatmentSub: 'Non-Surgical Fat Reduction',
    bulletPoints: ['Reduces Stubborn Fat', 'Safe & Painless', 'No Downtime'],
    packagePrice: '₹45,000 /month',
    address: '162, Sector 28, Vashi, Navi Mumbai 400703',
    phone: '+91 98765 43210'
  },
  specComplianceScore: 92,
  specIssues: [
    {
      category: 'Claim Verification',
      severity: 'Medium' as const,
      description: '“Reduces Stubborn Fat” requires clinical data substantiation in production.'
    },
    {
      category: 'Typography',
      severity: 'Low' as const,
      description: 'The font weight for the pricing block should align with brand SemiBold tokens.'
    }
  ],
  specFixes: [
    'Update claim to: “Helps in reducing stubborn fat with Cryolipolysis.”',
    'Use the brand-approved font weight (SemiBold) for the price section.'
  ]
};
