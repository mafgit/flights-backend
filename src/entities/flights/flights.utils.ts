import { ISearchResult } from "./flights.types";

export function cartesian(arrays: ISearchResult[][]) {
  return arrays.reduce<ISearchResult[][]>(
    (a, b) => a.flatMap((x) => b.map((y) => [...x, y])),
    [[]]
  );
}
