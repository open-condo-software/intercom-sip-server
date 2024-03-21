import React from 'react';
import { IRoute } from "../utils/routing";
import * as PAGES from "../pages";
import { ROOT } from "../const/clientUrl";

export const routes: IRoute[] = [
    {
        path: ROOT,
        element: <PAGES.Root />,
        default: true,
    },
];
