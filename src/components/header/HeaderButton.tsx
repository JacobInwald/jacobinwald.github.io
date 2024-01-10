import "./header.css";

interface Props {
  headings: string[][];
}

function HeaderButton({ headings }: Props) {
  function* constructHeading() {
    for (let [k, v] of headings) yield <a href={v}>{k}</a>;
  }
  let [...headingHTML] = constructHeading();
  return <>{headingHTML}</>;
}

export default HeaderButton;
