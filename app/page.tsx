import { AboutSection } from "@/components/aboutSection";
import { Header } from "@/components/header";
import { HeroSection } from "@/components/heroSection";
import { LocationSection } from "@/components/locationSection";
import { PricingSection } from "@/components/pricingSection";
import { ServicesSection } from "@/components/servicesSection";
import { ShoppingCatalog } from "@/components/shoppingCatalog";
import { FAQSection } from "@/components/faqSection";
import { ContactSection } from "@/components/contactSection";
import { Footer } from "@/components/footer";
import GallerySection from "@/components/gallerySection";
import { ChatbotWidget } from "@/components/chatbot-widget";



export default function Home (){
    return (
        <main className="min-h-screen">
            <Header />
            <HeroSection />
            <AboutSection />
            <ServicesSection />
            <PricingSection />
            <ShoppingCatalog />
            <LocationSection />
            <GallerySection />
            <FAQSection/>
            <ContactSection />
            <Footer />
            <ChatbotWidget />
        </main>

    )
}