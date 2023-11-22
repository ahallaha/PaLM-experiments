// https://econweb.ucsd.edu/~jandreon/Econ264/papers/Charness%20Rabin%20QJE%202002.pdf

export async function run(bot) {
  const scenarios = [
    { name: "Berk29", leftOption: { optionA: 400, optionB: 400 }, rightOption: { optionA: 750, optionB: 400 } },
    { name: "Berk26", leftOption: { optionA: 0, optionB: 800 }, rightOption: { optionA: 400, optionB: 400 } },
    { name: "Berk23", leftOption: { optionA: 800, optionB: 200 }, rightOption: { optionA: 0, optionB: 0 } },
    { name: "Berk15", leftOption: { optionA: 200, optionB: 700 }, rightOption: { optionA: 600, optionB: 600 } },
    { name: "Barc8", leftOption: { optionA: 300, optionB: 600 }, rightOption: { optionA: 700, optionB: 500 } },
    { name: "Barc2", leftOption: { optionA: 400, optionB: 400 }, rightOption: { optionA: 750, optionB: 375 } }
  ]

  const endowments = [
    { name: "default" },
    { name: "Inequity aversion", instruction: "You only care about fairness between players." },
    { name: "Efficient", instruction: "You only care about the total payoff of both players." },
    { name: "Self-interested", instruction: "You only care about your own payoff." }
  ]

  const combinations = []
  const promises = []

  for (const endowment of endowments) {
    for (const scenario of scenarios) {
      promises.push(askBot(bot, endowment, scenario))
      combinations.push({ endowment: endowment.name, scenario: scenario.name, choices: `[[${scenario.leftOption.optionA}, ${scenario.leftOption.optionB}], [${scenario.rightOption.optionA}, ${scenario.rightOption.optionB}]]` })
    }
  }

  const results = await matchResults(promises, combinations)
  displayResults(results)
}

async function matchResults(promises, combinations) {
  const combinationsCopy = JSON.parse(JSON.stringify(combinations))
  const promiseResults = await Promise.allSettled(promises)

  for (let i = 0; i < combinationsCopy.length; i++) {
    combinationsCopy[i].response = promiseResults[i].value
      ? parseResponse(promiseResults[i].value)
      : { choice: undefined, explanation: promiseResults[i].reason }
  }

  return combinationsCopy
}

function parseResponse(rawString) {
  // We have to do lots of work here because PaLM can't follow instructions
  try {
    return JSON.parse(rawString.match(/\{[\s\S]*\}/).pop())
  } catch (e) {
    return {
      choice: rawString.match(/left|right/i).pop(),
      explanation: rawString
    }
  }
}

function askBot(bot, endowment, scenario) {
  return bot.ask(
    `You are deciding on allocations for yourself and another person, Person A.
    ${endowment?.instruction}
      
    Option left: You get ${scenario.leftOption.optionB}, Person A gets ${scenario.leftOption.optionA}.
    Option right: You get ${scenario.rightOption.optionB}, Person A gets ${scenario.rightOption.optionA}.
    
    What do you choose, left or right?
    Return your response following this format without deviation:

    { 
      "choice": "right or left",
      "explanation": "explanation of choice"
    }
    
    Do not include any additional text besides the JSON object.
    Only provide a RFC8259 compliant JSON response.`
  )
}

function displayResults(results) {
  console.log("Charness and Raben: Unilateral Dictator Test")

  console.table(results.map(res => ({
    endowment: res.endowment,
    scenario: `${res.scenario}: ${res.choices}`,
    choice: res.response.choice
  })))

  console.log("\n")
}