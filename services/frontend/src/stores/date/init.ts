import { sample } from "effector";
import {$dateStore, getDateEvent, getDateFx, updateDateEvent} from "../date/model";
import { DateState } from "../types";
import { handleGetDate } from "./handlers/handleGetDate";

getDateFx.use(handleGetDate);

$dateStore
    .on(updateDateEvent, (state: DateState, payload: DateState['date']) => ({
        ...state,
        date: payload
    }));

getDateFx.doneData.watch(({ date }: { date: DateState['date'] }) => {
    updateDateEvent(date);
});

sample({
    clock: getDateEvent,
    source: $dateStore,
    target: getDateFx,
});
