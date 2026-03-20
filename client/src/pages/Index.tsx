import { useAuth } from "@/context/AuthContext";
import Home from "@/pages/Home";
import LandingPage from "@/pages/LandingPage";

export default function Index() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            </div>
        );
    }

    return isAuthenticated ? <Home /> : <LandingPage />;
}
