import { memo, useCallback } from "react";
import { QuizScreen } from "./components/QuizScreen.jsx";
import { ResultsScreen } from "./components/ResultsScreen.jsx";
import { StartScreen } from "./components/StartScreen.jsx";
import { useQuiz } from "./context/QuizContext.jsx";
import { useTheme } from "./context/ThemeContext.jsx";

const ThemeToggle = memo(function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button className="ghostButton themeToggle" type="button" onClick={toggleTheme}>
      <span className="toggleGlyph" aria-hidden="true" />
      {theme === "dark" ? "Dark" : "Light"}
    </button>
  );
});

const Header = memo(function Header() {
  const { state, resetQuiz } = useQuiz();
  const showHome = state.phase !== "start";

  const handleReset = useCallback(() => {
    resetQuiz();
  }, [resetQuiz]);

  return (
    <header className="appHeader">
      <div>
        <p className="eyebrow">React Lab 9</p>
        <h1>Quiz Atelier</h1>
      </div>
      <div className="headerActions">
        {showHome ? (
          <button className="ghostButton" type="button" onClick={handleReset}>
            Acasă
          </button>
        ) : null}
        <ThemeToggle />
      </div>
    </header>
  );
});

export default function App() {
  const { state } = useQuiz();

  return (
    <div className="appFrame">
      <Header />
      <main className="appMain">
        {state.phase === "quiz" ? <QuizScreen /> : null}
        {state.phase === "results" ? <ResultsScreen /> : null}
        {state.phase === "start" ? <StartScreen /> : null}
      </main>
    </div>
  );
}
