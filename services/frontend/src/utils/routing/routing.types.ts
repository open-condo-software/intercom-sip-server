import { ReactNode } from "react";

export interface IRoute {
    default?: boolean;
    path: string;
    element: ReactNode;
}
