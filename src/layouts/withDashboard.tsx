import type { JSX } from "react";
import DashboardLayout from "./DashboardLayout";

export default function withDashboard(
    Component: () => JSX.Element
) {
    return function WrappedWithDashboard() {
        return (
            <DashboardLayout>
                <Component  />
            </DashboardLayout>
        );
    };
};