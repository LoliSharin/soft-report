interface AboutScreenProps {
  onGoBack: () => void;
}

export function AboutScreen({ onGoBack }: AboutScreenProps) {
  return (
    <main className="home-screen">
      <section className="hero-panel">
        <p className="hero-panel__eyebrow">Second Screen</p>
        <h1 className="hero-panel__title">Другая страница</h1>
        <p className="hero-panel__description">
          Ты перешел на второй экран. Кнопка ниже вернет тебя обратно.
        </p>
        <button className="primary-button" onClick={onGoBack}>
          Назад
        </button>
      </section>
    </main>
  );
}
