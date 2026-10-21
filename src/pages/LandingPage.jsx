import Navbar from '../features/landing/Navbar';
import Hero from '../features/landing/Hero';
import AboutSection from '../features/landing/AboutSection';
import FeaturedProducts from '../features/landing/FeaturedProducts';
import ServicesSection from '../features/landing/ServicesSection';
import ContactSection from '../features/landing/ContactSection';
import Footer from '../features/landing/Footer';

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <AboutSection />
        <FeaturedProducts />
        <ServicesSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
