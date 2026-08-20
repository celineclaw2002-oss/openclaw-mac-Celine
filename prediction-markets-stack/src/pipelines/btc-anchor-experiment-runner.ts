import { readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import type {
  ExternalAnchorContractObservation,
  ExternalAnchorTradeSimulation
} from "../domain/observations.js";
import { DeterministicSimulationModule } from "../modules/module-8-simulation.js";
import type { ExecutionTemplateId } from "../shared/enums.js";

export interface BtcAnchorExperimentRunnerOptions {
  outputRoot?: string;
  templates?: ExecutionTemplateId[];
  residualThresholds?: number[];
}

export interface BtcAnchorExperimentRun {
  observationId: string;
  contractId: string;
  executionTemplateId: ExecutionTemplateId;
  residualThreshold: number;
  signalDirection: "buy_yes" | "buy_no";
  residualSignal: number;
  simulatedPnlToClose?: number;
  simulatedPnlToResolution?: number;
  expectedSlippage?: number;
}

export interface BtcAnchorScorecardRow {
  executionTemplateId: ExecutionTemplateId;
  residualThreshold: number;
  eligibleObservations: number;
  simulatedTrades: number;
  meanResidualSignal: number;
  meanPnlToClose?: number;
  medianPnlToClose?: number;
  meanPnlToResolution?: number;
  medianPnlToResolution?: number;
  hitRateToClose?: number;
  hitRateToResolution?: number;
}

export interface BtcAnchorExperimentSummary {
  outputRoot: string;
  scopeNote: string;
  mappedObservations: number;
  diagnosticRows: number;
  observationTimeMs?: number;
  totalObservations: number;
  evaluatedTradableObservations: number;
  tradableObservations: number;
  nonTradableObservations: number;
  skippedIneligibleObservations: number;
  experimentRuns: number;
  scorecard: BtcAnchorScorecardRow[];
}

export async function runBtcAnchorExperimentRunner(
  options: BtcAnchorExperimentRunnerOptions = {}
): Promise<BtcAnchorExperimentSummary> {
  const outputRoot = options.outputRoot ?? (await resolveLatestCaptureRoot(process.cwd()));
  const templates = options.templates ?? ["aggressive_all_legs", "passive_first", "hybrid_edge_tiered"];
  const residualThresholds = options.residualThresholds ?? [0, 0.01, 0.02];
  const observations = await readJsonFile<ExternalAnchorContractObservation[]>(
    path.join(outputRoot, "observations", "external-anchor-btc.json")
  );
  const tradableObservations = observations.filter((observation) => observation.tradableFlag);

  const simulationModule = new DeterministicSimulationModule({
    anchorObservationsById: new Map(observations.map((observation) => [observation.observationId, observation])),
    internalObservationsById: new Map()
  });

  const runs: BtcAnchorExperimentRun[] = [];
  const scorecard: BtcAnchorScorecardRow[] = [];

  for (const residualThreshold of residualThresholds) {
    const eligible = tradableObservations.filter((observation) => {
      const residualSignal = observation.calibratedResidual ?? observation.rawResidual;
      return residualSignal !== undefined && observation.mappingSafeFlag && Math.abs(residualSignal) > residualThreshold;
    });

    for (const template of templates) {
      const simulations: Array<ExternalAnchorTradeSimulation & { contractId: string; residualSignal: number }> = [];
      for (const observation of eligible) {
        const simulation = await simulationModule.simulateAnchor(observation.observationId, template);
        if (!simulation) {
          continue;
        }
        const residualSignal = observation.calibratedResidual ?? observation.rawResidual;
        if (residualSignal === undefined) {
          continue;
        }
        simulations.push({
          ...simulation,
          contractId: observation.contractId,
          residualSignal
        });
        runs.push({
          observationId: observation.observationId,
          contractId: observation.contractId,
          executionTemplateId: template,
          residualThreshold,
          signalDirection: residualSignal >= 0 ? "buy_no" : "buy_yes",
          residualSignal,
          ...(simulation.simulatedPnlToClose === undefined
            ? {}
            : { simulatedPnlToClose: simulation.simulatedPnlToClose }),
          ...(simulation.simulatedPnlToResolution === undefined
            ? {}
            : { simulatedPnlToResolution: simulation.simulatedPnlToResolution }),
          ...(simulation.expectedSlippage === undefined
            ? {}
            : { expectedSlippage: simulation.expectedSlippage })
        });
      }

      scorecard.push({
        executionTemplateId: template,
        residualThreshold,
        eligibleObservations: eligible.length,
        simulatedTrades: simulations.length,
        meanResidualSignal: mean(simulations.map((simulation) => Math.abs(simulation.residualSignal))),
        ...(simulations.length === 0
          ? {}
          : {
              meanPnlToClose: mean(simulations.map((simulation) => simulation.simulatedPnlToClose ?? 0)),
              medianPnlToClose: median(simulations.map((simulation) => simulation.simulatedPnlToClose ?? 0)),
              meanPnlToResolution: mean(simulations.map((simulation) => simulation.simulatedPnlToResolution ?? 0)),
              medianPnlToResolution: median(
                simulations.map((simulation) => simulation.simulatedPnlToResolution ?? 0)
              ),
              hitRateToClose: mean(
                simulations.map((simulation) => ((simulation.simulatedPnlToClose ?? 0) > 0 ? 1 : 0))
              ),
              hitRateToResolution: mean(
                simulations.map((simulation) => ((simulation.simulatedPnlToResolution ?? 0) > 0 ? 1 : 0))
              )
            })
      });
    }
  }

  await writeFile(
    path.join(outputRoot, "simulations", "external-anchor-btc-experiments.json"),
    `${JSON.stringify(runs, null, 2)}\n`,
    "utf8"
  );

  const summary: BtcAnchorExperimentSummary = {
    outputRoot,
    scopeNote:
      "This scorecard only evaluates tradable external-anchor observations admitted by the current BTC anchor path. Mapped-but-nontradable BTC contracts are counted but excluded from simulated trades.",
    mappedObservations: observations.length,
    diagnosticRows: observations.length,
    ...(observations.length === 0
      ? {}
      : { observationTimeMs: Math.max(...observations.map((observation) => observation.observationTimeMs)) }),
    totalObservations: observations.length,
    evaluatedTradableObservations: tradableObservations.length,
    tradableObservations: tradableObservations.length,
    nonTradableObservations: observations.filter((observation) => !observation.tradableFlag).length,
    skippedIneligibleObservations: observations.filter((observation) => !observation.tradableFlag || !observation.mappingSafeFlag).length,
    experimentRuns: runs.length,
    scorecard
  };
  await writeFile(
    path.join(outputRoot, "summaries", "external-anchor-btc-scorecard.json"),
    `${JSON.stringify(summary, null, 2)}\n`,
    "utf8"
  );
  return summary;
}

async function resolveLatestCaptureRoot(cwd: string): Promise<string> {
  const capturesRoot = path.resolve(cwd, "data", "kalshi-live");
  const entries = await readdir(capturesRoot, { withFileTypes: true });
  const directories = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .reverse();
  for (const directory of directories) {
    const candidateRoot = path.join(capturesRoot, directory);
    const observationsPath = path.join(candidateRoot, "observations", "external-anchor-btc.json");
    try {
      const details = await stat(observationsPath);
      if (details.isFile()) {
        return candidateRoot;
      }
    } catch {
      continue;
    }
  }
  throw new Error("No Kalshi live capture directories with external-anchor BTC observations found.");
}

async function readJsonFile<T>(target: string): Promise<T> {
  return JSON.parse(await readFile(target, "utf8")) as T;
}

function mean(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((left, right) => left - right);
  const mid = Math.floor(sorted.length / 2);
  const center = sorted[mid];
  if (center === undefined) {
    return 0;
  }
  if (sorted.length % 2 !== 0) {
    return center;
  }
  const previous = sorted[mid - 1];
  return previous === undefined ? center : (previous + center) / 2;
}
