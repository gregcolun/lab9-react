import { memo, useCallback, useEffect, useMemo } from "react";
import { useQuiz } from "../context/QuizContext.jsx";
import { useTimer } from "../hooks/useTimer.js";

const DifficultyBadge = memo(function DifficultyBadge() {
  const { state } = useQuiz();
  const question = state.questions[state.currentIndex];

  if (!question) {
    return null;
  }

  return (
    <span className={`difficultyBadge ${question.difficulty}`}>
      {question.difficulty}
    </span>
  );
});

export function QuizScreen() {
  const { state, answerQuestion, nextQuestion, resetQuiz } = useQuiz();
  const question = state.questions[state.currentIndex];

  const currentAnswer = useMemo(() => {
    if (!question) {
      return null;
    }

    return state.answers.find((answer) => answer.questionId === question.id);
  }, [question, state.answers]);

  const handleExpire = useCallback(() => {
    answerQuestion(null);
  }, [answerQuestion]);

  const { remaining, progress } = useTimer({
    duration: state.config?.timeLimit ?? 0,
    startedAt: state.questionStartedAt,
    isActive: Boolean(question) && !currentAnswer,
    onExpire: handleExpire,
  });

  useEffect(() => {
    if (!currentAnswer) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      nextQuestion();
    }, 1100);

    return () => window.clearTimeout(timeout);
  }, [currentAnswer, nextQuestion]);

  const handleAnswer = useCallback(
    (answer) => {
      answerQuestion(answer);
    },
    [answerQuestion],
  );

  const progressPercent = useMemo(() => {
    if (!state.questions.length) {
      return 0;
    }

    return ((state.currentIndex + 1) / state.questions.length) * 100;
  }, [state.currentIndex, state.questions.length]);

  if (!question) {
    return (
      <section className="emptyState">
        <h2>Nu există întrebări pentru această sesiune.</h2>
        <button className="primaryButton" type="button" onClick={resetQuiz}>
          Revino la start
        </button>
      </section>
    );
  }

  return (
    <section className="quizPanel" aria-labelledby="quiz-question">
      <div className="quizTopbar">
        <div>
          <p className="eyebrow">
            Întrebarea {state.currentIndex + 1} din {state.questions.length}
          </p>
          <div className="metaRow">
            <span>{question.category}</span>
            <DifficultyBadge />
            {state.streak >= 2 ? (
              <span className="streakBadge">Streak {state.streak}</span>
            ) : null}
          </div>
        </div>
        <div className="scoreMini">
          <strong>{state.answers.filter((answer) => answer.isCorrect).length}</strong>
          corecte
        </div>
      </div>

      <div className="progressTrack" aria-hidden="true">
        <span style={{ width: `${progressPercent}%` }} />
      </div>

      <div className="questionBlock">
        <h2 id="quiz-question">{question.question}</h2>

        {state.config.timeLimit > 0 ? (
          <div className="timerBox" aria-live="polite">
            <span>{remaining}s</span>
            <div className="timerTrack">
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : (
          <div className="timerBox relaxed">Timp nelimitat</div>
        )}
      </div>

      <div className="answersGrid">
        {question.options.map((option) => {
          const isSelected = currentAnswer?.selectedAnswer === option;
          const isCorrect = currentAnswer && option === question.answer;
          const isWrongSelection =
            currentAnswer && isSelected && option !== question.answer;
          const feedbackClass = isCorrect
            ? "correct"
            : isWrongSelection
              ? "wrong"
              : "";

          return (
            <button
              className={`answerButton ${feedbackClass}`}
              disabled={Boolean(currentAnswer)}
              key={option}
              onClick={() => handleAnswer(option)}
              type="button"
            >
              {option}
            </button>
          );
        })}
      </div>

      {currentAnswer ? (
        <div
          className={`feedbackBox ${currentAnswer.isCorrect ? "success" : "danger"}`}
          role="status"
        >
          {currentAnswer.isCorrect
            ? "Răspuns corect."
            : currentAnswer.timedOut
              ? `Timp expirat. Răspuns corect: ${currentAnswer.correctAnswer}.`
              : `Răspuns greșit. Corect era: ${currentAnswer.correctAnswer}.`}
        </div>
      ) : null}
    </section>
  );
}
