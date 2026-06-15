import { environmentCases } from "./environment.test.js";
import { levelFrameworkCases } from "./levelFramework.test.js";
import { coreMechanicsCases } from "./coreMechanics.test.js";
import { unitInteractionCases } from "./unitInteractions.test.js";

export const allTestCases = [
  ...environmentCases,
  ...levelFrameworkCases,
  ...coreMechanicsCases,
  ...unitInteractionCases,
];
