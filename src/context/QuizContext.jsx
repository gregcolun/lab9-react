import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import questions from "../data/questions.json";
import { buildQuestionSet } from "../utils/quiz.js";

const ACTIVE_SESSION_KEY = "lab9-quiz-active-session";

const initialQuizState = {
  phase: "start",
  config: null,
  questions: [],
  currentIndex: 0,
  answers: [],
  streak: 0,
  maxStreak: 0,
  questionStartedAt: null,
  attemptId: null,
  startedAt: null,
  finishedAt: null,
};

const QuizContext = createContext(null);

function createAttemptId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadStoredSession() {
  if (typeof window === "undefined") {
    return initialQuizState;
  }

  try {
    const storedValue = window.localStorage.getItem(ACTIVE_SESSION_KEY);

    if (!storedValue) {
      return initialQuizState;
    }

    const parsed = JSON.parse(storedValue);
    const hasActiveQuiz =
      parsed?.phase === "quiz" &&
      Array.isArray(parsed.questions) &&
      parsed.questions.length > 0;

    return hasActiveQuiz ? parsed : initialQuizState;
  } catch {
    return initialQuizState;
  }
}

function quizReducer(state, action) {
  switch (action.type) {
    case "START_QUIZ": {
      const { config, selectedQuestions, attemptId, startedAt } = action.payload;

      return {
        ...initialQuizState,
        phase: "quiz",
        config,
        questions: selectedQuestions,
        attemptId,
        startedAt,
        questionStartedAt: startedAt,
      };
    }

    case "ANSWER_QUESTION": {
      if (state.phase !== "quiz") {
        return state;
      }

      const question = state.questions[state.currentIndex];

      if (!question) {
        return state;
      }

      const alreadyAnswered = state.answers.some(
        (answer) => answer.questionId === question.id,
      );

      if (alreadyAnswered) {
        return state;
      }

      const selectedAnswer = action.payload.answer;
      const isCorrect = selectedAnswer === question.answer;
      const nextStreak = isCorrect ? state.streak + 1 : 0;
      const answer = {
        questionId: question.id,
        question: question.question,
        category: question.category,
        difficulty: question.difficulty,
        options: question.options,
        selectedAnswer,
        correctAnswer: question.answer,
        isCorrect,
        timedOut: selectedAnswer === null,
        answeredAt: Date.now(),
      };

      return {
        ...state,
        answers: [...state.answers, answer],
        streak: nextStreak,
        maxStreak: Math.max(state.maxStreak, nextStreak),
      };
    }

    case "NEXT_QUESTION": {
      if (state.phase !== "quiz") {
        return state;
      }

      const nextIndex = state.currentIndex + 1;

      if (nextIndex >= state.questions.length) {
        return {
          ...state,
          phase: "results",
          streak: 0,
          finishedAt: Date.now(),
        };
      }

      return {
        ...state,
        currentIndex: nextIndex,
        questionStartedAt: Date.now(),
      };
    }

    case "RESET":
      return initialQuizState;

    default:
      return state;
  }
}

export function QuizProvider({ children }) {
  const [state, dispatch] = useReducer(
    quizReducer,
    undefined,
    loadStoredSession,
  );

  useEffect(() => {
    if (state.phase === "quiz") {
      window.localStorage.setItem(
        ACTIVE_SESSION_KEY,
        JSON.stringify({ ...state, persistedAt: Date.now() }),
      );
      return;
    }

    window.localStorage.removeItem(ACTIVE_SESSION_KEY);
  }, [state]);

  const startQuiz = useCallback((config) => {
    const selectedQuestions = buildQuestionSet(
      questions,
      config.category,
      config.questionCount,
    );
    const now = Date.now();

    dispatch({
      type: "START_QUIZ",
      payload: {
        config: {
          ...config,
          username: config.username.trim(),
          questionCount: selectedQuestions.length,
          timeLimit: Number(config.timeLimit),
        },
        selectedQuestions,
        attemptId: createAttemptId(),
        startedAt: now,
      },
    });
  }, []);

  const answerQuestion = useCallback((answer) => {
    dispatch({
      type: "ANSWER_QUESTION",
      payload: {
        answer,
      },
    });
  }, []);

  const nextQuestion = useCallback(() => {
    dispatch({ type: "NEXT_QUESTION" });
  }, []);

  const resetQuiz = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  const value = useMemo(
    () => ({
      state,
      startQuiz,
      answerQuestion,
      nextQuestion,
      resetQuiz,
    }),
    [state, startQuiz, answerQuestion, nextQuestion, resetQuiz],
  );

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
}

export function useQuiz() {
  const context = useContext(QuizContext);

  if (!context) {
    throw new Error("useQuiz trebuie folosit în interiorul QuizProvider.");
  }

  return context;
}
