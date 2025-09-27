import { useContext } from "react";
import { RequestContext } from "../contexts/RequestContext";

const useRequest = () => useContext(RequestContext);
export default useRequest;