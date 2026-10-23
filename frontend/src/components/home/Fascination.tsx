import Section from "../ui/Section";

const Fascination = () => (
  <Section>
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] items-center gap-8 md:gap-14 bg-brand px-6 md:px-14 py-8 md:py-14">
      <div>
        <div className="font-mono text-xs uppercase tracking-widest mb-5 text-on-brand-label">Faszination Stock-Car</div>
        <p className="text-2xl font-bold leading-tight md:text-3xl">
          Verbeultes Blech und spektakuläre Crashs sind an der Tagesordnung – zum Sieg gelangt man nur mit
          Durchhaltevermögen, guten Technikern und einer Prise Glück.
        </p>
      </div>
      <p className="text-base leading-relaxed text-on-brand-soft">
        Deshalb legt der Verband großen Wert auf die Sicherheit jedes Fahrers: Der Innenraum wird bis auf das Nötigste
        befreit, Anhängerkupplung und Originaltank entfernt, die Fahrertür versteift und Sportsitze eingebaut. Statt
        Fensterscheiben kommen Gitter zum Einsatz. So ist ausreichender Schutz vor Unfall-, Splitter- und Feuergefahr
        gewährleistet.
      </p>
    </div>
  </Section>
);

export default Fascination;
