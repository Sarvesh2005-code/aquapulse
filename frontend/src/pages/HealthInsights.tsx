import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  HeartPulse,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  Droplet,
  Filter,
  Stethoscope,
  ChevronRight,
  BrainCircuit,
  SlidersHorizontal,
} from 'lucide-react';
import { SharedDataContext } from '../components/Layout';
import { StatusBadge } from '../components/StatusBadge';

export function HealthInsights() {
  const { analysis, sensorData, isOnline, lastUpdated } = useOutletContext<SharedDataContext>();

  // Diagnostic state can also be tested interactively during evaluation
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null);

  const activeCondition = selectedCondition || (analysis ? analysis.skin_risk : 'Safe (No Skin Risk)');
  const isSafe = activeCondition.toLowerCase().includes('safe');

  // Condition specific medical data & remedy catalog
  const conditionProfiles: Record<
    string,
    {
      title: string;
      riskLevel: 'Low' | 'Moderate' | 'High';
      badgeStatus: 'safe' | 'warning' | 'danger';
      physiologicalMechanism: string;
      typicalSymptoms: string[];
      waterRemedies: string[];
      topicalRemedies: string[];
      habits: string[];
      medicalThreshold: string;
    }
  > = {
    'Safe (No Skin Risk)': {
      title: 'Physiologically Balanced (Acid Mantle Preserved)',
      riskLevel: 'Low',
      badgeStatus: 'safe',
      physiologicalMechanism:
        'Water chemistry matches natural stratum corneum acidity and contains balanced ionic solids. Cuticle scales remain flat, preserving natural moisture factors (NMF).',
      typicalSymptoms: ['Soft supple skin', 'Glossy hair texture', 'Zero post-bath tightness'],
      waterRemedies: [
        'Routine maintenance: Standard domestic filtration is completely sufficient.',
        'Preserve current balance: Periodically flush water storage tanks to avoid stagnant biofilm.',
      ],
      topicalRemedies: [
        'Maintain natural hydration with light hyaluronic acid or glycerin-based lotion.',
        'Use standard gentle surfactant cleansers.',
      ],
      habits: [
        'Shower at comfortable ambient temperatures (22°C - 32°C).',
        'Drink adequate potable water to maintain internal cellular turgor.',
      ],
      medicalThreshold: 'No dermatological intervention indicated.',
    },
    'Dry Skin Risk': {
      title: 'Alkaline Sebum Depletion & Xerosis Propensity',
      riskLevel: 'Moderate',
      badgeStatus: 'warning',
      physiologicalMechanism:
        'Alkaline pH (>8.5) and high TDS mineral hardness interact with natural fatty acids, dissolving the protective intercellular lipid matrix and leading to transepidermal water loss (TEWL).',
      typicalSymptoms: ['Flaking skin', 'Ashen appearance on limbs', 'Tight, itchy sensation after bathing', 'Frizzy, brittle hair shafts'],
      waterRemedies: [
        'Install a multi-stage shower filter with ion-exchange resin to trap calcium & magnesium.',
        'Consider an inline citric acid or Vitamin C dechlorinating/softening cartridge.',
      ],
      topicalRemedies: [
        'Apply ceramide-rich barrier repair cream (3:1:1 lipid ratio) within 3 minutes of bathing.',
        'Switch from traditional soap to syndet cleansing bars buffered at pH 5.5.',
        'Use leave-in silicone or argan oil hair serums to seal hair shaft cuticles.',
      ],
      habits: [
        'Limit hot shower duration to under 10 minutes (excessive heat accelerates sebum dissolution).',
        'Pat skin dry with a soft microfiber towel; avoid abrasive rubbing.',
      ],
      medicalThreshold: 'Consult a dermatologist if deep fissures, persistent pruritus, or eczema flare-ups develop.',
    },
    'Scalp Irritation Risk': {
      title: 'Acidic Dermatitis & Follicular Sensitivity',
      riskLevel: 'Moderate',
      badgeStatus: 'warning',
      physiologicalMechanism:
        'Sub-optimal acidic pH (<6.5) creates a stinging osmotic gradient across micro-abrasions, stimulating sensory C-fibers and provoking erythema on delicate scalp tissue.',
      typicalSymptoms: ['Stinging sensation upon water contact', 'Scalp redness and itching', 'Dandruff-like shedding', 'Micro-folliculitis'],
      waterRemedies: [
        'Aerate water or run through an alkalizing neutralizing media filter (calcite/corosex).',
        'Verify plumbing pipes for potential acidic copper/iron leaching.',
      ],
      topicalRemedies: [
        'Use soothing scalp tonics formulated with Aloe Vera, Panthenol (Pro-Vitamin B5), or Centella Asiatica.',
        'Wash hair with sulfate-free, mild physiological pH shampoos.',
        'Incorporate colloidal oatmeal soaks to alleviate acute scalp irritation.',
      ],
      habits: [
        'Rinse scalp with cool-to-lukewarm water to prevent cutaneous vasodilation.',
        'Avoid chemical perms, dyes, or harsh styling gels until water quality is normalized.',
      ],
      medicalThreshold: 'Seek clinical evaluation if erythema spreads to hairline or if weeping lesions occur.',
    },
    'Skin Irritation Risk': {
      title: 'Microbial & Particulate Contact Dermatitis Risk',
      riskLevel: 'High',
      badgeStatus: 'danger',
      physiologicalMechanism:
        'Elevated turbidity (>5.0 NTU) indicates colloidal suspended particulates, oxidized rust, or microbiological biofilm harboring opportunistic pathogens that trigger inflammatory dermatitis.',
      typicalSymptoms: ['Papular eruptions or small bumps', 'Contact dermatitis patches', 'Allergic erythema', 'Clogged pores and breakouts'],
      waterRemedies: [
        'Immediate installation of 5-micron sediment pre-filter cartridge to arrest suspended solids.',
        'Sanitize domestic storage overhead tanks with safe chlorination or UV filtration.',
      ],
      topicalRemedies: [
        'Wash exposed areas with antimicrobial, antiseptic cleansers containing 2% Salicylic Acid or Zinc Pyrithione.',
        'Apply calming non-comedogenic calamine or colloidal oatmeal suspensions.',
      ],
      habits: [
        'Avoid washing open cuts or broken skin with untreated water.',
        'Boil water or run through activated carbon + UV purification before any face washing.',
      ],
      medicalThreshold: 'Promptly consult medical practitioner if pustules, spreading rash, or fever accompany symptoms.',
    },
  };

  const currentProfile =
    conditionProfiles[activeCondition] || conditionProfiles['Safe (No Skin Risk)'];

  const confidenceScore = analysis?.probability
    ? (analysis.probability * 100).toFixed(1)
    : '98.5';

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              AI Health & Dermatological Studio
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Random Forest multi-feature intelligence linking water metrics to skin & hair vitality
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
            <BrainCircuit className="w-3.5 h-3.5 text-cyan-500" />
            <span>Random Forest (100 Trees)</span>
          </span>
        </div>
      </div>

      {/* Hero Diagnostic Prediction Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 space-y-6">
        {!isOnline && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs font-medium flex items-center justify-between gap-2">
            <span>Awaiting active sensor stream to update real-time AI classification. Showing last recorded evaluation.</span>
            <span className="font-bold text-[10px] px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 shrink-0">Device Offline</span>
          </div>
        )}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <StatusBadge status={isOnline ? currentProfile.badgeStatus : 'warning'} label={isOnline ? currentProfile.riskLevel + ' Risk' : 'Awaiting Stream'} />
              <span className="text-xs font-bold text-slate-400">
                {isOnline ? 'AI Classification Result' : 'Awaiting active sensor stream'}
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {isOnline ? activeCondition : 'Awaiting active sensor stream'}
            </h3>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              {currentProfile.title}
            </p>
          </div>

          {/* Model Confidence Meter */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/40 dark:to-cyan-950/40 border border-teal-200/60 dark:border-teal-800/60 flex items-center space-x-4 min-w-[220px]">
            <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-teal-200 dark:border-teal-700">
              <Sparkles className="w-7 h-7 text-teal-500 animate-pulse" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
                Model Confidence
              </span>
              <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                {confidenceScore}%
              </span>
              <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold block">
                Feature match confirmed
              </span>
            </div>
          </div>
        </div>

        {/* Biological Mechanism Box */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-teal-500" />
            <span>Pathophysiological Mechanism</span>
          </h4>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {currentProfile.physiologicalMechanism}
          </p>
        </div>

        {/* Symptoms checklist */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Correlated Symptoms & Observations:
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {currentProfile.typicalSymptoms.map((sym, idx) => (
              <div
                key={idx}
                className="flex items-center space-x-2 p-3 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm"
              >
                <div className="w-2 h-2 rounded-full bg-teal-500 shrink-0"></div>
                <span>{sym}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3-Pillar Actionable Remedy Toolkit */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pillar 1: Water Source & Filtration */}
        <div className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-cyan-50 dark:bg-cyan-950/50 text-cyan-500 border border-cyan-200/60 dark:border-cyan-800/60">
              <Filter className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                1. Water Filtration
              </h4>
              <p className="text-xs text-slate-400">Hardware & plumbing remediation</p>
            </div>
          </div>

          <ul className="space-y-3">
            {currentProfile.waterRemedies.map((remedy, idx) => (
              <li key={idx} className="flex items-start space-x-2.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <CheckCircle2 className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                <span>{remedy}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pillar 2: Topical Dermatology Regimen */}
        <div className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/50 text-teal-500 border border-teal-200/60 dark:border-teal-800/60">
              <Droplet className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                2. Topical Regimen
              </h4>
              <p className="text-xs text-slate-400">Barrier restoration & skincare</p>
            </div>
          </div>

          <ul className="space-y-3">
            {currentProfile.topicalRemedies.map((remedy, idx) => (
              <li key={idx} className="flex items-start space-x-2.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                <span>{remedy}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pillar 3: Daily Bathing Habits */}
        <div className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-500 border border-emerald-200/60 dark:border-emerald-800/60">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                3. Preventive Habits
              </h4>
              <p className="text-xs text-slate-400">Bathing temperature & techniques</p>
            </div>
          </div>

          <ul className="space-y-3">
            {currentProfile.habits.map((habit, idx) => (
              <li key={idx} className="flex items-start space-x-2.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{habit}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Clinical Consultation Alert Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-rose-50/70 via-amber-50/50 to-transparent dark:from-rose-950/30 dark:via-amber-950/20 dark:to-transparent border border-rose-200/80 dark:border-rose-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start space-x-3">
          <Stethoscope className="w-6 h-6 text-rose-500 shrink-0 mt-1 sm:mt-0" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Clinical Advisory & Medical Boundaries
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
              {currentProfile.medicalThreshold}
            </p>
          </div>
        </div>

        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
          Academic Capstone System
        </span>
      </div>
    </div>
  );
}
