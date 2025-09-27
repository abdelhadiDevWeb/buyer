import { requests } from "./utils";

export const BidsCheck = {
    checkBids: (id: { id: string }): Promise<any> => requests.post('/bid/check', id),
}
