import "./header.css";

interface Props {
  heading: string[];
  contents: string[][];
}

function DropDown({ heading, contents }: Props) {
  return (
    <div className="dropdown">
      <a className="dropbtn" href={heading[1]}>
        {heading[0]}
      </a>
      <div className="dropdown-content">
        {contents.map((items) => (
          <a href={items[1]}>{items[0]}</a>
        ))}
      </div>
    </div>
  );
}

export default DropDown;
