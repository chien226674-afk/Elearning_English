import HeroSection from "@/components/landing/HeroSection"
import FeatureSection from "@/components/landing/FeatureSection"
import HowItWorkSection from "@/components/landing/HowItWorkSection"
import CompanionSection from "@/components/landing/CompanionSection"
import WhySection from "@/components/landing/WhySection"
import CTASection from "@/components/landing/CTASection"
import Footer from "@/components/landing/Footer"

export default function LandingPage() {
    return (
        <div className="bg-white text-gray-800">

            <HeroSection />

            <FeatureSection />

            <HowItWorkSection />

            <CompanionSection />

            <WhySection />

            <CTASection />

            <Footer />

        </div>
    )
}