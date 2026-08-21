export type EndStateCapabilityStatus = "planned" | "in_progress" | "complete";

export interface EndStateCapabilityDefinition {
  capabilityId: string;
  title: string;
  whyItMatters: string;
  status: EndStateCapabilityStatus;
  evidence: string[];
  nextMilestone: string;
}

export interface EndStateDomainDefinition {
  domainId: string;
  title: string;
  researchBasis: string;
  objective: string;
  capabilities: EndStateCapabilityDefinition[];
}

export interface ResearchPlatformEndStateDefinition {
  version: string;
  platformName: string;
  northStar: string;
  endStateDefinition: string;
  domains: EndStateDomainDefinition[];
}

export const researchPlatformEndState: ResearchPlatformEndStateDefinition = {
  version: "2026-08-21",
  platformName: "Prediction Markets Research Platform",
  northStar:
    "A fully reproducible, multi-venue prediction-markets research and execution stack with hedge-fund-grade data lineage, calibration discipline, portfolio construction, and production controls.",
  endStateDefinition:
    "The finished system should let a senior quant researcher trace any live or historical trade recommendation back to normalized contract semantics, point-in-time market data, external anchors, model versions, scoring diagnostics, portfolio constraints, and execution assumptions.",
  domains: [
    {
      domainId: "data_replay",
      title: "Point-in-Time Data And Replay",
      researchBasis:
        "Serious systematic research depends on point-in-time data integrity, replayability, and leakage control.",
      objective:
        "Every research result and paper/live decision must be regenerable from archived venue data, anchor data, and deterministic replay tooling.",
      capabilities: [
        {
          capabilityId: "data_multivenue_capture",
          title: "Multi-venue acquisition across Kalshi, Polymarket, and external anchors",
          whyItMatters: "Alpha and robustness depend on seeing the same economic event through multiple market structures and reference feeds.",
          status: "in_progress",
          evidence: ["Kalshi live capture pipeline", "Polymarket BTC scan", "Coinbase and Deribit anchor capture"],
          nextMilestone: "Expand beyond BTC into additional anchored families and retain more complete quote history."
        },
        {
          capabilityId: "data_point_in_time_replay",
          title: "Historical point-in-time replay for research snapshots and experiments",
          whyItMatters: "A quant stack is not credible if historical insights cannot be regenerated without look-ahead.",
          status: "in_progress",
          evidence: ["Polymarket BTC research backfill runner", "Kalshi replay-oriented capture folders"],
          nextMilestone: "Add portfolio-aware historical replay with archived quote surfaces and event clocks."
        },
        {
          capabilityId: "data_lineage_integrity",
          title: "Artifact lineage from raw payload to research output",
          whyItMatters: "Researchers need to audit exactly which payloads and transforms produced each score or signal.",
          status: "in_progress",
          evidence: ["Raw/staging/normalized/state/observations folder structure"],
          nextMilestone: "Stamp all artifacts with dataset ids, schema versions, and model provenance."
        }
      ]
    },
    {
      domainId: "semantic_normalization",
      title: "Semantic Normalization And Contract Graphs",
      researchBasis:
        "Prediction markets are structurally heterogeneous, so alpha extraction requires semantic normalization before modeling.",
      objective:
        "Reduce venue-specific contracts into a canonical graph of thresholds, buckets, complements, partitions, and temporal nesting relationships.",
      capabilities: [
        {
          capabilityId: "semantic_contract_model",
          title: "Canonical contract semantics",
          whyItMatters: "Without canonical semantics, calibration, aggregation, and cross-market comparisons are unreliable.",
          status: "in_progress",
          evidence: ["Normalization modules for contracts, thresholds, buckets, rules, and families"],
          nextMilestone: "Extend canonical semantics to more family types and explicit resolution ambiguity controls."
        },
        {
          capabilityId: "semantic_relationship_graph",
          title: "Relationship graph for monotonicity, complement, partition, and nesting edges",
          whyItMatters: "Internal-consistency alpha and portfolio de-duplication both depend on a correct contract graph.",
          status: "in_progress",
          evidence: ["Graph module", "Internal consistency observations"],
          nextMilestone: "Add cross-venue event linking and explicit ladder overlap matrices."
        }
      ]
    },
    {
      domainId: "modeling_calibration",
      title: "Modeling, Calibration, And Benchmarking",
      researchBasis:
        "Proper scoring rules, benchmark baselines, and calibration checks are standard for probabilistic forecasting and should anchor all fair-value work.",
      objective:
        "Every model must be benchmarked against sensible baselines, segmented by regime, and evaluated with proper scoring plus stability diagnostics.",
      capabilities: [
        {
          capabilityId: "model_anchor_baselines",
          title: "Anchor-driven fair-value baselines",
          whyItMatters: "A hedge-fund-grade process starts with interpretable baseline models before higher-complexity models are added.",
          status: "in_progress",
          evidence: ["BTC raw anchor probability path", "Barrier backtest summary"],
          nextMilestone: "Add more family-specific baseline models and benchmark tables."
        },
        {
          capabilityId: "model_proper_scoring",
          title: "Proper scoring, calibration, and segment-aware evaluation",
          whyItMatters: "Brier, log loss, calibration error, and walk-forward testing are table stakes for probabilistic models.",
          status: "in_progress",
          evidence: ["Barrier backtest with Brier and log loss", "Segment-aware policy gating"],
          nextMilestone: "Add rolling walk-forward retraining, calibration drift monitoring, and hypothesis tests."
        },
        {
          capabilityId: "model_ensemble_stack",
          title: "Model library spanning structural, external-anchor, and flow signals",
          whyItMatters: "The best end state combines complementary alpha sleeves rather than relying on one modeling idea.",
          status: "planned",
          evidence: [],
          nextMilestone: "Introduce a model registry plus ensemble diagnostics for multiple sleeves."
        }
      ]
    },
    {
      domainId: "simulation_execution",
      title: "Simulation, Paper Trading, And Execution Realism",
      researchBasis:
        "Execution assumptions dominate live viability, so simulations must reflect fill uncertainty, slippage, and venue constraints.",
      objective:
        "Bridge research signals into realistic paper and later live execution loops with explicit assumptions and measurable degradation versus idealized alpha.",
      capabilities: [
        {
          capabilityId: "sim_deterministic_execution_templates",
          title: "Deterministic execution-template simulations",
          whyItMatters: "Even a first simulator should quantify how much edge survives after execution style choices.",
          status: "in_progress",
          evidence: ["Module 8 simulation", "Internal-consistency and BTC anchor experiment runners"],
          nextMilestone: "Add queue-position, depth-consumption, and latency-aware execution simulation."
        },
        {
          capabilityId: "sim_paper_loops",
          title: "Persistent paper trading loops",
          whyItMatters: "Live paper loops reveal operational and portfolio problems that static backtests miss.",
          status: "in_progress",
          evidence: ["Kalshi BTC paper loop", "Polymarket BTC paper loop"],
          nextMilestone: "Promote from single-sleeve loops to unified multi-sleeve portfolio paper trading."
        },
        {
          capabilityId: "sim_historical_portfolio_replay",
          title: "Portfolio-aware historical replay",
          whyItMatters: "A complete quant stack should replay position evolution, risk accumulation, and turnover through history.",
          status: "planned",
          evidence: [],
          nextMilestone: "Extend research backfill into a historical portfolio simulator using archived market surfaces."
        }
      ]
    },
    {
      domainId: "portfolio_risk",
      title: "Portfolio Construction And Risk",
      researchBasis:
        "Portfolio construction matters as much as signal quality because overlapping contracts can create hidden concentration and false diversification.",
      objective:
        "Translate trade-level alpha into capital allocation that respects overlap, regime, venue, liquidity, and tail-risk constraints.",
      capabilities: [
        {
          capabilityId: "risk_overlap_controls",
          title: "Overlap-aware sizing and concentration controls",
          whyItMatters: "Threshold ladders and related event families can silently magnify the same economic bet.",
          status: "in_progress",
          evidence: ["Polymarket ladder-aware correlation controls", "Overlap-adjusted sizing"],
          nextMilestone: "Generalize from single-family controls to portfolio-wide correlation and scenario exposure controls."
        },
        {
          capabilityId: "risk_stress_framework",
          title: "Stress testing and scenario analytics",
          whyItMatters: "Senior quants expect scenario-aware risk, not just realized PnL summaries.",
          status: "planned",
          evidence: [],
          nextMilestone: "Add regime shock tables, event co-resolution scenarios, and liquidity stress overlays."
        },
        {
          capabilityId: "risk_capital_allocator",
          title: "Capital allocator across sleeves and venues",
          whyItMatters: "The finished platform should decide not only what to trade, but how much budget each sleeve deserves.",
          status: "planned",
          evidence: [],
          nextMilestone: "Implement expected-value, confidence, and crowding-aware sleeve allocation."
        }
      ]
    },
    {
      domainId: "production_controls",
      title: "Production Controls, Governance, And Observability",
      researchBasis:
        "Institutional robustness requires controlled promotion from research to paper to production, with guardrails and auditability.",
      objective:
        "Make the platform operable and reviewable by a research lead, risk lead, and engineer without relying on tribal knowledge.",
      capabilities: [
        {
          capabilityId: "prod_artifact_provenance",
          title: "Model, dataset, and artifact provenance",
          whyItMatters: "Without provenance, live recommendations cannot be audited or trusted.",
          status: "planned",
          evidence: [],
          nextMilestone: "Add run manifests tying research outputs to model version, config hash, and input artifact ids."
        },
        {
          capabilityId: "prod_monitoring",
          title: "Monitoring for data freshness, model drift, and execution anomalies",
          whyItMatters: "Production failure usually starts with stale feeds or silently degraded behavior.",
          status: "planned",
          evidence: [],
          nextMilestone: "Emit freshness and drift scorecards plus loop health alerts."
        },
        {
          capabilityId: "prod_promotion_framework",
          title: "Promotion gates from research to paper to production",
          whyItMatters: "A strong research shop has explicit criteria for what earns more capital and automation.",
          status: "planned",
          evidence: [],
          nextMilestone: "Define go/no-go scorecards with minimum calibration, turnover, and drawdown thresholds."
        }
      ]
    }
  ]
};
