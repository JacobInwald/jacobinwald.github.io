import "./App.css";
import Header from "./components/header/Header";
import InfoCard from "./components/InfoCard";

function App() {
  const title: string = "Jacob Inwald";
  const headings: string[][] = [
    ["Home", "#home"],
    ["About Me", "#about_me"],
  ];

  return (
    <div className="bg-primary">
      <Header title={title} headings={headings} />
      <a style={{ height: "100x" }} />
      <InfoCard />
    </div>
  );
}

export default App;
