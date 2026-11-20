import { createHivesRepository } from "./hives.repository.js";
import { createMeasuresRepository } from "./measures.repository.js";
import { createInspectionsRepository } from "./inspections.repository.js";

// Mêmes noms que createMemoryRepositories : createApp ne voit pas la différence.
export function createPostgresRepositories(pool) {
  return {
    hivesRepository: createHivesRepository(pool),
    measuresRepository: createMeasuresRepository(pool),
    inspectionsRepository: createInspectionsRepository(pool),
  };
}
