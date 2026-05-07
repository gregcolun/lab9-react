import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useQuiz } from "../context/QuizContext.jsx";
import { useLocalStorage } from "../hooks/useLocalStorage.js";
import { ALL_CATEGORIES } from "../utils/quiz.js";

const HISTORY_KEY = "lab9-quiz-score-history";

const MetricCard = memo(function MetricCard({ label, value, detail }) {
  return (
    <article className="metricCard">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
});

const ReviewCard = memo(function ReviewCard({ answer }) {
  return (
    <article className={`reviewCard ${answer.isCorrect ? "ok" : "miss"}`}>
      <div className="reviewHeader">
        <span>{answer.category}</span>
        <span>{answer.difficulty}</span>
      </div>
      <h3>{answer.question}</h3>
      <p>
        Răspuns dat:{" "}
        <strong>{answer.selectedAnswer ?? "fără răspuns"}</strong>
      </p>
      {!answer.isCorrect ? (
        <p>
          Răspuns corect: <strong>{answer.correctAnswer}</strong>
        </p>
      ) : null}
    </article>
  );
});

export function ResultsScreen() {
  const { state, resetQuiz } = useQuiz();
  const [history, setHistory] = useLocalStorage(HISTORY_KEY, []);
  const [tab, setTab] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState(ALL_CATEGORIES);

  const score = useMemo(
    () => state.answers.filter((answer) => answer.isCorrect).length,
    [state.answers],
  );
  const total = state.answers.length;
  const percentage = total ? Math.round((score / total) * 100) : 0;

  const categoryStats = useMemo(() => {
    const stats = new Map();

    state.answers.forEach((answer) => {
      const current = stats.get(answer.category) ?? {
        category: answer.category,
        correct: 0,
        total: 0,
      };

      stats.set(answer.category, {
        ...current,
        correct: current.correct + (answer.isCorrect ? 1 : 0),
        total: current.total + 1,
      });
    });

    return [...stats.values()];
  }, [state.answers]);

  const reviewCategories = useMemo(
    () => [ALL_CATEGORIES, ...categoryStats.map((item) => item.category)],
    [categoryStats],
  );

  const filteredAnswers = useMemo(() => {
    return state.answers.filter((answer) => {
      const matchesTab =
        tab === "all" ||
        (tab === "correct" && answer.isCorrect) ||
        (tab === "wrong" && !answer.isCorrect);
      const matchesCategory =
        categoryFilter === ALL_CATEGORIES || answer.category === categoryFilter;

      return matchesTab && matchesCategory;
    });
  }, [categoryFilter, state.answers, tab]);

  useEffect(() => {
    if (state.phase !== "results" || !state.attemptId || !state.finishedAt) {
      return;
    }

    setHistory((currentHistory) => {
      const alreadySaved = currentHistory.some(
        (item) => item.attemptId === state.attemptId,
      );

      if (alreadySaved) {
        return currentHistory;
      }

      return [
        {
          attemptId: state.attemptId,
          username: state.config.username,
          score,
          total,
          percentage,
          maxStreak: state.maxStreak,
          category: state.config.category,
          date: new Date(state.finishedAt).toISOString(),
        },
        ...currentHistory,
      ].slice(0, 50);
    });
  }, [
    percentage,
    score,
    setHistory,
    state.attemptId,
    state.config,
    state.finishedAt,
    state.maxStreak,
    state.phase,
    total,
  ]);

  const sortedHistory = useMemo(() => {
    return [...history]
      .sort((first, second) => {
        if (second.percentage !== first.percentage) {
          return second.percentage - first.percentage;
        }

        if (second.score !== first.score) {
          return second.score - first.score;
        }

        return new Date(second.date).getTime() - new Date(first.date).getTime();
      })
      .slice(0, 10);
  }, [history]);

  const handleRetry = useCallback(() => {
    resetQuiz();
  }, [resetQuiz]);

  const handleCategoryFilter = useCallback((event) => {
    setCategoryFilter(event.target.value);
  }, []);

  return (
    <section className="resultsLayout" aria-labelledby="results-title">
      <div className="resultsHero">
        <div>
          <p className="eyebrow">Rezultate pentru {state.config?.username}</p>
          <h2 id="results-title">
            {score} din {total} corecte
          </h2>
          <p className="lead">
            Ai obținut {percentage}% și un streak maxim de {state.maxStreak}.
          </p>
        </div>
        <button className="primaryButton" type="button" onClick={handleRetry}>
          Încearcă din nou
        </button>
      </div>

      <div className="metricsGrid">
        <MetricCard label="Scor" value={`${score}/${total}`} detail="răspunsuri corecte" />
        <MetricCard label="Procentaj" value={`${percentage}%`} detail="performanță finală" />
        <MetricCard label="Streak maxim" value={state.maxStreak} detail="corecte consecutive" />
      </div>

      <div className="splitLayout">
        <section className="surfaceBlock">
          <div className="sectionHeader">
            <h3>Pe categorii</h3>
          </div>
          <div className="categoryBreakdown">
            {categoryStats.map((item) => (
              <article className="breakdownRow" key={item.category}>
                <div>
                  <strong>{item.category}</strong>
                  <span>
                    {item.correct} din {item.total}
                  </span>
                </div>
                <div className="miniBar" aria-hidden="true">
                  <span style={{ width: `${(item.correct / item.total) * 100}%` }} />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="surfaceBlock">
          <div className="sectionHeader">
            <h3>Top scoruri</h3>
          </div>
          <div className="historyTableWrap">
            <table className="historyTable">
              <thead>
                <tr>
                  <th>Utilizator</th>
                  <th>Scor</th>
                  <th>%</th>
                  <th>Streak</th>
                </tr>
              </thead>
              <tbody>
                {sortedHistory.map((entry) => (
                  <tr key={entry.attemptId}>
                    <td>{entry.username}</td>
                    <td>
                      {entry.score}/{entry.total}
                    </td>
                    <td>{entry.percentage}%</td>
                    <td>{entry.maxStreak}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="surfaceBlock reviewBlock">
        <div className="sectionHeader reviewControls">
          <h3>Revizuire răspunsuri</h3>
          <div className="filterRow">
            <div className="tabs" role="tablist" aria-label="Filtru răspunsuri">
              <button
                className={tab === "all" ? "active" : ""}
                onClick={() => setTab("all")}
                type="button"
              >
                Toate
              </button>
              <button
                className={tab === "correct" ? "active" : ""}
                onClick={() => setTab("correct")}
                type="button"
              >
                Corecte
              </button>
              <button
                className={tab === "wrong" ? "active" : ""}
                onClick={() => setTab("wrong")}
                type="button"
              >
                Greșite
              </button>
            </div>
            <select value={categoryFilter} onChange={handleCategoryFilter}>
              {reviewCategories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="reviewGrid">
          {filteredAnswers.map((answer) => (
            <ReviewCard answer={answer} key={answer.questionId} />
          ))}
        </div>
      </section>
    </section>
  );
}
