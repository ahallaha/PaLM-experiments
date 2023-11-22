// https://scholar.harvard.edu/files/rzeckhauser/files/status_quo_bias_in_decision_making.pdf

export async function run(bot) {
  const allocations = [
    { auto: "70%", highway: "30%" },
    { auto: "30%", highway: "70%" },
    { auto: "60%", highway: "40%" },
    { auto: "50%", highway: "50%" }
  ]

  const scenarios = []
  const promises = []

  // neutral framing
  promises.push(askBot(bot, allocations))
  scenarios.push({ framing: "Neutral framing" })

  for (let i = 0; i < allocations.length; i++) {
    // move to toSpliced in node 20
    const options = JSON.parse(JSON.stringify(allocations))
    options.splice(i, 1)

    promises.push(askBot(bot, options, allocations[i]))
    scenarios.push({ framing: `${allocations[i].auto} auto framed as status quo` })
  }

  const results = await matchResults(promises, scenarios)
  displayResults(results)
}

async function matchResults(promises, scenarios) {
  const scenariosCopy = JSON.parse(JSON.stringify(scenarios))
  const promiseResults = await Promise.allSettled(promises)

  for (let i = 0; i < scenariosCopy.length; i++) {
    scenariosCopy[i].response = promiseResults[i].value
      ? parseResponse(promiseResults[i].value)
      : { choice: undefined, explanation: promiseResults[i].reason }
  }

  return scenariosCopy
}

function parseResponse(rawString) {
  // We have to do lots of work here because PaLM can't follow instructions
  try {
    return JSON.parse(rawString.match(/\{[\s\S]*\}/).pop())
  } catch (e) {
    return {
      choice: rawString.match(/(allocate[\s\S]*safety)/i).pop(),
      explanation: rawString
    }
  }
}

function askBot(bot, options, statusQuo) {
  const prompt = !statusQuo
    ? `The National Highway Safety Commission is deciding how to allocate its budget between two safety research programs: ` +
    `i) improving automobile safety (bumpers, body, gas tank configurations, seatbelts) and ` +
    `ii) improving the safety of interstate highways (guard rails, grading, highway interchanges, and implementing selectively reduced speed limits).

    It is considering four options. Choose one: 

    a) Allocate ${options[0].auto} to auto safety and ${options[0].highway} to highway safety
    b) Allocate ${options[1].auto} to auto safety and ${options[1].highway} to highway safety
    c) Allocate ${options[2].auto} to auto safety and ${options[2].highway} to highway safety
    d) Allocate ${options[3].auto} to auto safety and ${options[3].highway} to highway safety

    Return your response following this format without deviation:

    { 
      "choice": "Allocate ${options[0].auto} to auto safety and ${options[0].highway} to highway safety, ` +
    `Allocate ${options[1].auto} to auto safety and ${options[1].highway} to highway safety, ` +
    `Allocate ${options[2].auto} to auto safety and ${options[2].highway} to highway safety, or ` +
    `Allocate ${options[3].auto} to auto safety and ${options[3].highway} to highway safety",
      "explanation": "explanation of choice"
    }
    
    Do not include any additional text besides the JSON object.
    Only provide a RFC8259 compliant JSON response.`
    : `The National Highway Safety Commission is reasessing the allocation of its budget between two safety research programs: ` +
    `i) improving automobile safety (bumpers, body, gas tank configurations, seatbelts) and ` +
    `ii) improving interstate highways (guard rails, grading, highway interchanges, and implementing selective reduced speed limits). 
    
    Currently, the comission allocates approximately ${statusQuo.auto} of its funds to auto safety and ${statusQuo.highway} of its funds to highway safety. 
    Since there is a ceiling on its total spending, it has four options. Choose one:
    
    a) Maintain present budget amounts for the programs
    b) Allocate ${options[0].auto} to auto safety and ${options[0].highway} to highway safety
    c) Allocate ${options[1].auto} to auto safety and ${options[1].highway} to highway safety
    d) Allocate ${options[2].auto} to auto safety and ${options[2].highway} to highway safety
    
    Return your response following this format without deviation:

    { 
      "choice": "Maintain present budget amounts for the programs, ` +
    `Allocate ${options[0].auto} to auto safety and ${options[0].highway} to highway safety, ` +
    `Allocate ${options[1].auto} to auto safety and ${options[1].highway} to highway safety, or ` +
    `Allocate ${options[2].auto} to auto safety and ${options[2].highway} to highway safety",
      "explanation": "explanation of choice"
    }
    
    Do not include any additional text besides the JSON object.
    Only provide a RFC8259 compliant JSON response.`

  return bot.ask(prompt)
}


function displayResults(results) {
  console.log("Status Quo bias in decision-making: Samuelson and Zeckhauser")

  console.table(results.map(res => ({
    framing: res.framing,
    choice: res.response.choice
  })))

  console.log("\n")
}