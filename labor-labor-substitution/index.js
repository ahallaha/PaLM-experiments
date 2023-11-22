export async function run(bot) {
  const candidates = {
    person1: {
      experience: 1
    },
    person2: {
      experience: 0,
      wage: 13
    }
  }

  const wages = [13, 14, 15, 16, 17, 18, 19]
  const minWage = 15

  const combinations = []
  const promises = []

  for (const wage of wages) {
    const p1Temp = { ...candidates.person1, wage }
    promises.push(askBot(bot, p1Temp, candidates.person2))
    combinations.push({ minWage: "none", person1: p1Temp, person2: candidates.person2 })
  }

  // impose minimum wage
  for (const wage of wages) {
    const p1Temp = { ...candidates.person1, wage: wage < minWage ? minWage : wage }
    const p2Temp = { ...candidates.person2, wage: candidates.person2.wage < minWage ? minWage : candidates.person2.wage }
    promises.push(askBot(bot, p1Temp, p2Temp))
    combinations.push({ minWage: minWage, person1: p1Temp, person2: p2Temp })
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
    // return {
    //   choice: rawString.match(/completely fair|acceptable|unfair|very unfair/i).pop(),
    //   explanation: rawString
    // }
    console.error(e)
    return {
      choice: "NEITHER!"
    }
  }
}

function askBot(bot, person1, person2) {
  return bot.ask(
    `You are hiring for the role of “Dishwasher.” The typical hourly rate is $12/hour.
    You have 2 candidates.
    Person 1: Has ${person1.experience} year(s) of experience in this role. Requests $${person1.wage}/hour. 
    Person 2: Has ${person2.experience} year(s) of experience in this role. Requests $${person2.wage}/hour.
    Who would you hire? You have to pick one.

    Please respond with a json in the following format without deviation:
    {
      "choice": "Person 1" or "Person 2",
      "explanation": "explanation of choice"
    }
    
    Do not include any additional text besides the JSON object.
    Only provide a RFC8259 compliant JSON response.`
  )
}

function displayResults(results) {
  console.log("Labor-labor substitution in the presence of a minimum wage: Horton")

  console.table(results.map(res => ({
    "Person 1": `${res.person1.experience}, ${res.person1.wage}`,
    "Person 2": `${res.person2.experience}, ${res.person2.wage}`,
    "minimum wage": res.minWage,
    choice: res.response.choice
  })))

  console.log("\n")
}