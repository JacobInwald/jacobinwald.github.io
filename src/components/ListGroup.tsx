import { useState } from "react";

interface Props {
  items: string[];
  heading: string;
  onSelectItem: (item: string) => void;
}

function ListGroup({ items = [], heading = "Header", onSelectItem }: Props) {
  // Hook
  const [selectedIndex, setSelectedIndex] = useState(-1);

  return (
    <>
      <h1>{heading}</h1>
      <ul className="list-group">
        {items.map((x, i) => (
          <li
            className={
              selectedIndex === i ? "list-group-item active" : "list-group-item"
            }
            key={i}
            onClick={() => {
              setSelectedIndex(i);
              onSelectItem(x);
            }}
          >
            {x}
          </li>
        ))}
      </ul>
    </>
  );
}

export default ListGroup;
