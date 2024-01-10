import { TSMap } from "typescript-map";
import "./infocard.css";

interface Props {
  content: TSMap<string, string>[];
}

function InfoCard({ content }: Props) {
  const title: string = content[0].get("content");

  function contentToHTML(item: TSMap<string, string>, id: string) {
    // Used for defaults
    function getOrElse<A>(map: TSMap<A, A>, key: A, value: A): A {
      return map.has(key) ? map.get(key) : value;
    }
    // Simple switch
    switch (getOrElse(item, "tag", "")) {
      case "p":
        return (
          <p id={title.toLowerCase().replace(" ", "-") + id}>
            {getOrElse(item, "content", "")}
          </p>
        );
      case "img":
        return (
          <img
            id={title.toLowerCase().replace(" ", "-") + id}
            src={getOrElse(item, "src", "")}
            className={getOrElse(item, "class", "")}
            style={{
              height: getOrElse(item, "style", "100%"),
              width: getOrElse(item, "style", "100%"),
            }}
          />
        );
    }
  }

  return (
    <div
      id={"infocard-" + title.toLowerCase().replace(" ", "-")}
      className="infocard"
    >
      <h1 id={title.toLowerCase().replace(" ", "-")}>{title}</h1>
      <div
        id={"infocard-padding-" + title.toLowerCase().replace(" ", "-")}
      ></div>
      {content.map((x, id) => contentToHTML(x, id.toString()))}
    </div>
  );
}

export default InfoCard;
