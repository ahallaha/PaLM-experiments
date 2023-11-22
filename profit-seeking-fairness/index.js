// https://web.mit.edu/curhan/www/docs/Articles/15341_Readings/Justice/Kahneman.pdf

export async function run(bot) {
  const storeActions = ["changes the price to", "raises the price to"]
  const politicalViews = ["socialist", "leftist", "liberal", "moderate", "libertarian", "conservative"]
  const newPrices = ["$16", "$20", "$40", "$100"]

  const combinations = []
  const promises = []

  for (const action of storeActions) {
    for (const view of politicalViews) {
      for (const price of newPrices) {
        promises.push(askBot(bot, action, view, price))
        combinations.push({ action, view, price })
      }
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
    return JSON.parse(rawString.match(/\{[\s\S]*\}/).pop().replaceAll("\\", ""))
  } catch (e) {
    return {
      choice: rawString.match(/completely fair|acceptable|unfair|very unfair/i).pop(),
      explanation: rawString
    }
  }
}

function askBot(bot, storeAction, politicalView, newPrice) {
  return bot.ask(
    `A hardware store has been selling snow shovels for $15.
    The morning after a large snowstorm, the store ${storeAction} ${newPrice}.
    
    Please rate this action as:
    1) Completely Fair
    2) Acceptable
    3) Unfair
    4) Very Unfair
    
    You are a ${politicalView}.
    What is your choice ["Completely Fair", "Acceptable", "Unfair", or "Very Unfair"]?
    Please respond with a json in the following format without deviation:
    {
      "choice": ""Completely Fair", "Acceptable", "Unfair", or "Very Unfair"?",
      "explanation": "explanation of choice"
    }
    
    Do not include any additional text besides the JSON object.
    Only provide a RFC8259 compliant JSON response.`
  )
}

function displayResults(results) {
  console.log("Kahneman et al.: Fairness as a Constraint on Profit Seeking")

  console.table(results.map(res => ({
    "political view": res.view,
    scenario: `${res.action} ${res.price}`,
    choice: res.response.choice
  })))

  console.log("\n")
}