import { AboutSection } from "@/components/aboutSection";
import { Header } from "@/components/header";
import { HeroSection } from "@/components/heroSection";
import { LocationSection } from "@/components/locationSection";
import { PricingSection } from "@/components/pricingSection";
import { ServicesSection } from "@/components/servicesSection";
import { TestimonialsSection } from "@/components/testimonialsSection";
import { ShoppingCatalog } from "@/components/shoppingCatalog";
import { FAQSection } from "@/components/faqSection";
import { ContactSection } from "@/components/contactSection";
import { Footer } from "@/components/footer";
import GallerySection from "@/components/gallerySection";



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
            <TestimonialsSection />
            <GallerySection />
            <FAQSection/>
            <ContactSection />
            <Footer />
        </main>
        
    )
}