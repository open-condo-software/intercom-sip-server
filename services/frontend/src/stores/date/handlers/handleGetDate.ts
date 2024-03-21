import { HttpRequestMethods } from "src/const/HttpRequestMethods";
import { sendHttpRequest } from "src/utils/http/sendHttpRequest";
// use import from "../../../const/apiUrl" instead vars.fakeApiUrl for non-external api
import { vars } from "src/configs/vars";

export const handleGetDate = async () => {
    const result = await sendHttpRequest({
        url: vars.fakeApiUrl,
        method: HttpRequestMethods.Get,
        headers: {},
    });
    
    return {
        date: new Date(result.data.timestamp)
    };
}
