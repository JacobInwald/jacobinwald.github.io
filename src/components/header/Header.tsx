import "./header.css";
import DropDown from "./DropDown";
import HeaderButton from "./HeaderButton";

interface Props {
  title: string;
  headings: string[][];
}

// Title, PageRedirects (that can be drop down menus), Maybe button on right side with function
function Header({ title, headings }: Props) {
  const dd_contents = [
    ["List 1", "#list-1"],
    ["List 2", "#list-2"],
    ["List 3", "#list-3"],
    ["List 4", "#list-4"],
    ["List 5", "#list-5"],
  ];
  const dd_heading = ["Portfolio", "#portfolio"];

  return (
    <div
      className="navbar navbar-expand-lg sticky-top bg-secondary"
      role="navigation"
    >
      <div className="title">{title}</div>
      <HeaderButton headings={headings} />
      <DropDown heading={dd_heading} contents={dd_contents} />
    </div>
  );
}

export default Header;
