// https://arxiv.org/pdf/2301.07543.pdf

import 'dotenv/config'
import PaLM from "palm-api"
import { run as UnilateralDictator } from "./unilateral-dictator/index.js"

let bot = new PaLM(process.env.API_KEY)

console.log(await UnilateralDictator(bot))