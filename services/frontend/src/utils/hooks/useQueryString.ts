import queryString from "query-string";
import { useMemo } from "react";

const useQueryString = () => {
    const parsed = useMemo(() => queryString.parse(location.search), [location.search]);
    return parsed;
}

export default useQueryString;