export const ALL_CATEGORIES = "Toate";

export function getCategories(questions) {
  return [...new Set(questions.map((question) => question.category))];
}

export function getQuestionsByCategory(questions, category) {
  if (category === ALL_CATEGORIES) {
    return questions;
  }

  return questions.filter((question) => question.category === category);
}

export function shuffleArray(items) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }

  return shuffled;
}

export function buildQuestionSet(questions, category, questionCount) {
  const availableQuestions = getQuestionsByCategory(questions, category);
  const requestedCount = Number(questionCount);
  const count = Number.isFinite(requestedCount)
    ? Math.min(requestedCount, availableQuestions.length)
    : availableQuestions.length;

  return shuffleArray(availableQuestions).slice(0, count);
}
