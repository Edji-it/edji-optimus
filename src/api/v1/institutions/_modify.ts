// helps us validate that a rubric is there and is greater than 0 before proceeding
// the schema will catch if properties on the rubric are missing, but will not care if we are missing rubric all together
export function validateRubric(outcomes: Outcomes[]): any {
  let rubric = outcomes[0].rubric ? outcomes[0].rubric : undefined
  
  if (!rubric) {
    return {
      "error": "Bad Request",
      "message": "missing rubric from request",
      "statusCode": 400
    }
  }
}

interface Outcomes {
  standard: string
  short_name: string
  outcome_statement: string
  rubric: Rubric[]
}

interface Rubric {
  grade: Number
  rubric_statement: string
}