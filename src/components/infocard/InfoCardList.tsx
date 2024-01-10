import { TSMap } from "typescript-map";
import InfoCard from "./InfoCard";

interface Props {
  data: TSMap<string, string>[][];
}

function InfoCardList({ data }: Props) {
  return (
    <>
      {data.map((item) => (
        <InfoCard content={item} />
      ))}
    </>
  );
}

export default InfoCardList;
