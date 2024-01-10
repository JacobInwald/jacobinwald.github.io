import Header from "./components/header/Header";
import InfoCardList from "./components/infocard/InfoCardList";
import { TSMap } from "typescript-map";
import { data } from "./data/about-me.json";
import "./App.css";

function App() {
  const title: string = "Jacob Inwald";
  const headings: string[][] = [
    ["Home", "#home"],
    ["About Me", "#about_me"],
  ];
  const content = data.map((a) =>
    a.map((m) => new TSMap<string, string>().fromJSON(m))
  );

  return (
    <div className="bg-primary">
      <Header title={title} headings={headings} />
      <a style={{ height: "100x" }} />
      <InfoCardList data={content} />
    </div>
  );
}

export default App;
