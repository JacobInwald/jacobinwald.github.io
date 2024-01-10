import { HashRouter } from "react-router-dom";
import Header from "./components/header/Header";
import InfoCardList from "./components/infocard/InfoCardList";
import { TSMap } from "typescript-map";
import { list_data } from "./data/infocards.json";
import "./App.css";

function App() {
  const title: string = "Jacob Inwald";
  const headings: string[][] = [
    ["Home", "#home"],
    ["About Me", "#about_me"],
  ];
  // Parse List data
  const content = list_data.map((a) =>
    a.map((m) => new TSMap<string, string>().fromJSON(m))
  );

  return (
    <HashRouter>
      <div className="bg-primary">
        <Header title={title} headings={headings} />
        <a style={{ height: "100x" }} />
        <InfoCardList data={content} />
      </div>
    </HashRouter>
  );
}

export default App;
