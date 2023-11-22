// https://arxiv.org/pdf/2301.07543.pdf

import 'dotenv/config'
import PaLM from "palm-api"
import { run as UnilateralDictator } from "./unilateral-dictator/index.js"
import { run as ProfitSeekingFairness } from "./profit-seeking-fairness/index.js"
import { run as StatusQuoBias } from "./status-quo-bias/index.js"
import { run as LaborLaborSubstitution } from "./labor-labor-substitution/index.js"

const bot = new PaLM(process.env.API_KEY)

// await these if you care about the order they are printed
UnilateralDictator(bot)
ProfitSeekingFairness(bot)
StatusQuoBias(bot)
LaborLaborSubstitution(bot)
