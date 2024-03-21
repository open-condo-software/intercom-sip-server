import {createDomain} from "effector";

export const rootDomain = createDomain('rootDomain');

export const dateDomain = rootDomain.createDomain('dateDomain');
