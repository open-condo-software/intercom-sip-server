import { FC } from "react";
import { Navigate, Route, Routes } from "react-router";

import { IRoute } from ".";

interface Props {
    routes: IRoute[];
}

export const Routing: FC<Props> = ({ routes }) => {
    const defaultPath = routes.find((route) => route.default)?.path ?? null;

    return (
        <Routes>
            {routes.map((route) => (
                <Route
                    key={route.path}
                    element={route.element}
                    path={route.path}
                />
            ))}
            {defaultPath && (
                <Route path="*" element={<Navigate to={defaultPath} />} />
            )}
        </Routes>
    );
};
