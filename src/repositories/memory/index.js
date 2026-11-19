import { SEED_HIVES, loadSeedMeasures } from "./seed.js";
import { createMemoryHivesRepository } from "./hives.repository.js";
import { createMemoryMeasuresRepository } from "./measures.repository.js";
import { createMemoryInspectionsRepository } from "./inspections.repository.js";

// Crée les trois repositories en mémoire, préremplis.
export function createMemoryRepositories() {
  return {
    hivesRepository: createMemoryHivesRepository(SEED_HIVES),
    measuresRepository: createMemoryMeasuresRepository(loadSeedMeasures(SEED_HIVES.map((h) => h.id))),
    inspectionsRepository: createMemoryInspectionsRepository(),
  };
}
