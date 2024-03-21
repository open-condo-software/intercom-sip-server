import { dateDomain } from "../domains";
import { DateState } from "../types";

export const $dateStore = dateDomain.createStore<DateState>({ date: null });

export const updateDateEvent = dateDomain.createEvent<DateState['date']>('updateDateEvent');

export const getDateFx = dateDomain.effect<void, DateState>('getDateFx');

export const getDateEvent = dateDomain.createEvent('getDateEvent');
