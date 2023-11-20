// https://www.jstor.org/stable/4132490

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

export async function run(bot) {
  const results = []
  const promises = []

  for (const endowment of endowments) {
    for (const scenario of scenarios) {
      promises.push(askBot(bot, endowment, scenario))
      results.push({ endowment: endowment.name, scenario: scenario.name, choices: `[[${scenario.leftOption.optionA}, ${scenario.leftOption.optionB}], [${scenario.rightOption.optionA}, ${scenario.rightOption.optionB}]]` })
    }
  }

  const promiseResults = await Promise.allSettled(promises)
  for (let i = 0; i < results.length; i++) {
    results[i].response = promiseResults[i].value
      ? (() => {
        // We have to do lots of work here because PaLM can't follow instructions
        // TODO: pull first instance of 'right' or 'left' from result to construct result JSON.
        try {
          return JSON.parse(promiseResults[i].value.substring(promiseResults[i].value.indexOf("{"), promiseResults[i].value.indexOf("}") + 1))
        } catch (e) {
          return promiseResults[i].value
        }
      })()
      : promiseResults[i].reason
  }

  return results
}

function askBot(bot, endowment, scenario) {
  return bot.ask(
    `You are deciding on allocations for yourself and another person, Person A.
      
    Option Left: You get ${scenario.leftOption.optionB}, Person A gets ${scenario.leftOption.optionA}.
    Option Right: You get ${scenario.rightOption.optionB}, Person A gets ${scenario.rightOption.optionA}.
    
    What do you choose, Left or Right?
    Return your response following this format without deviation:

    { 
      "choice": "right or left",
      "explanation": "explanation of choice"
    }
    
    Do not include any additional text besides the JSON object.
    Only provide a RFC8259 compliant JSON response.`,
    { context: endowment?.instruction }
  )
}