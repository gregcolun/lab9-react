import { memo, useCallback, useEffect, useMemo, useState } from "react";
import questions from "../data/questions.json";
import { useQuiz } from "../context/QuizContext.jsx";
import {
  ALL_CATEGORIES,
  getCategories,
  getQuestionsByCategory,
} from "../utils/quiz.js";

const BASE_COUNT_OPTIONS = [5, 10, 15, 20];
const TIME_OPTIONS = [
  { label: "Nelimitat", value: 0 },
  { label: "10s", value: 10 },
  { label: "15s", value: 15 },
  { label: "20s", value: 20 },
  { label: "30s", value: 30 },
];

const CategorySummary = memo(function CategorySummary() {
  const categoryStats = useMemo(
    () =>
      getCategories(questions).map((category) => ({
        category,
        total: getQuestionsByCategory(questions, category).length,
      })),
    [],
  );

  return (
    <div className="categorySummary" aria-label="Categorii disponibile">
      {categoryStats.map((item) => (
        <span className="summaryPill" key={item.category}>
          {item.category}
          <strong>{item.total}</strong>
        </span>
      ))}
    </div>
  );
});

export function StartScreen() {
  const { startQuiz } = useQuiz();
  const [username, setUsername] = useState("");
  const [category, setCategory] = useState(ALL_CATEGORIES);
  const [questionCount, setQuestionCount] = useState(10);
  const [timeLimit, setTimeLimit] = useState(15);
  const [error, setError] = useState("");

  const categories = useMemo(
    () => [ALL_CATEGORIES, ...getCategories(questions)],
    [],
  );

  const availableQuestionCount = useMemo(
    () => getQuestionsByCategory(questions, category).length,
    [category],
  );

  const countOptions = useMemo(() => {
    const options = BASE_COUNT_OPTIONS.filter(
      (option) => option <= availableQuestionCount,
    );

    return options.includes(availableQuestionCount)
      ? options
      : [...options, availableQuestionCount];
  }, [availableQuestionCount]);

  useEffect(() => {
    if (!countOptions.includes(questionCount)) {
      setQuestionCount(countOptions.at(-1));
    }
  }, [countOptions, questionCount]);

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();

      if (!username.trim()) {
        setError("Introdu un nume de utilizator.");
        return;
      }

      setError("");
      startQuiz({
        username,
        category,
        questionCount,
        timeLimit,
      });
    },
    [category, questionCount, startQuiz, timeLimit, username],
  );

  const handleUsernameChange = useCallback((event) => {
    setUsername(event.target.value);
    setError("");
  }, []);

  const handleCategoryChange = useCallback((event) => {
    setCategory(event.target.value);
  }, []);

  const handleQuestionCountChange = useCallback((event) => {
    setQuestionCount(Number(event.target.value));
  }, []);

  const handleTimeLimitChange = useCallback((event) => {
    setTimeLimit(Number(event.target.value));
  }, []);

  return (
    <section className="startLayout" aria-labelledby="start-title">
      <div className="introPanel">
        <p className="eyebrow">Configurație quiz</p>
        <h2 id="start-title">Alege ritmul, categoria și pornește testul.</h2>
        <p className="lead">
          Întrebările sunt locale, împărțite în trei categorii, cu dificultăți
          mixte și feedback imediat după fiecare răspuns.
        </p>
        <CategorySummary />
      </div>

      <form className="configPanel" onSubmit={handleSubmit}>
        <label className="field">
          <span>Nume utilizator</span>
          <input
            autoComplete="name"
            className={error ? "invalid" : ""}
            onChange={handleUsernameChange}
            placeholder="ex. Ana"
            type="text"
            value={username}
          />
          {error ? <small className="errorText">{error}</small> : null}
        </label>

        <label className="field">
          <span>Categorie</span>
          <select value={category} onChange={handleCategoryChange}>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="segmentedGroup">
          <legend>Număr întrebări</legend>
          <div className="segmentedGrid">
            {countOptions.map((option) => (
              <label className="segmentedOption" key={option}>
                <input
                  checked={questionCount === option}
                  name="question-count"
                  onChange={handleQuestionCountChange}
                  type="radio"
                  value={option}
                />
                <span>{option === availableQuestionCount ? "Toate" : option}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="segmentedGroup">
          <legend>Timp per întrebare</legend>
          <div className="segmentedGrid timeGrid">
            {TIME_OPTIONS.map((option) => (
              <label className="segmentedOption" key={option.value}>
                <input
                  checked={timeLimit === option.value}
                  name="time-limit"
                  onChange={handleTimeLimitChange}
                  type="radio"
                  value={option.value}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <button className="primaryButton" type="submit">
          Pornește quizul
        </button>
      </form>
    </section>
  );
}
