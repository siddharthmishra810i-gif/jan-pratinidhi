import { useRef, useEffect } from "react";
import { ArrowRight, Instagram, Twitter, Globe } from "lucide-react";
import { AboutSection } from "../components/AboutSection";
import { FeaturedVideoSection } from "../components/FeaturedVideoSection";
import { PhilosophySection } from "../components/PhilosophySection";
import { ServicesSection } from "../components/ServicesSection";
import { Link } from "react-router-dom";
import { Navbar } from "../components/layout/Navbar";

export function HomePage() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.style.opacity = "0";

    const fadeDuration = 500; // ms
    let fadeAnimation: number;

    const fadeTo = (targetOpacity: number, duration: number) => {
      cancelAnimationFrame(fadeAnimation);
      const startOpacity = parseFloat(video.style.opacity) || 0;
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentOpacity = startOpacity + (targetOpacity - startOpacity) * progress;
        video.style.opacity = currentOpacity.toString();

        if (progress < 1) {
          fadeAnimation = requestAnimationFrame(animate);
        }
      };
      fadeAnimation = requestAnimationFrame(animate);
    };

    const handleCanPlay = () => {
      video.play();
      fadeTo(1, fadeDuration);
    };

    const handleTimeUpdate = () => {
      if (video.duration - video.currentTime <= 0.55) {
        fadeTo(0, fadeDuration);
      }
    };

    const handleEnded = () => {
      video.style.opacity = "0";
      setTimeout(() => {
        video.currentTime = 0;
        video.play();
        fadeTo(1, fadeDuration);
      }, 100);
    };

    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
      cancelAnimationFrame(fadeAnimation);
    };
  }, []);

  return (
    <div className="bg-black min-h-screen text-white font-sans selection:bg-white/30">
      {/* SECTION 1 -- HERO */}
      <section className="min-h-screen overflow-hidden relative flex flex-col">
        <video
          ref={videoRef}
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_074625_a81f018a-956b-43fb-9aee-4d1508e30e6a.mp4"
          muted
          autoPlay
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover object-bottom transition-opacity duration-500"
          style={{ opacity: 0 }}
        />

        {/* Navbar */}
        <Navbar className="absolute top-0 left-0 right-0 z-50" />

        {/* Hero Content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 text-center -translate-y-[10%] md:-translate-y-[15%] pt-32">
          <h1 className="text-7xl md:text-8xl lg:text-9xl text-white tracking-tight whitespace-nowrap font-serif mb-12">
            Know it then <em className="italic text-white/80">all</em>.
          </h1>
          
          <div className="max-w-xl w-full mx-auto mb-8">
            <div className="liquid-glass rounded-full pl-6 pr-2 py-2 flex items-center gap-3">
              <input
                type="text"
                placeholder="Search representatives, constituencies, parties..."
                className="bg-transparent border-none outline-none flex-1 text-white placeholder:text-white/40 text-sm md:text-base w-full"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    window.location.href = `/explore?q=${encodeURIComponent(e.currentTarget.value)}`;
                  }
                }}
              />
              <button 
                className="bg-white rounded-full p-3 text-black hover:scale-105 transition-transform shrink-0 flex items-center justify-center"
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                  if (input) {
                    window.location.href = `/explore?q=${encodeURIComponent(input.value)}`;
                  }
                }}
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <p className="text-white text-sm leading-relaxed px-4 max-w-md mx-auto mb-8">
            India's most comprehensive public representative information portal. Search MPs, MLAs, and constituencies.
          </p>
          
          <Link to="/explore" className="liquid-glass rounded-full px-8 py-3 text-white text-sm font-medium hover:bg-white/10 transition-colors inline-block">
            Launch Portal
          </Link>
        </div>

        {/* Social Icons Footer */}
        <div className="relative z-10 flex justify-center gap-4 pb-12 mt-auto">
          <a href="#" className="liquid-glass rounded-full p-4 text-white/80 hover:text-white hover:bg-white/10 transition-all">
            <Instagram className="w-5 h-5" />
          </a>
          <a href="#" className="liquid-glass rounded-full p-4 text-white/80 hover:text-white hover:bg-white/10 transition-all">
            <Twitter className="w-5 h-5" />
          </a>
          <a href="#" className="liquid-glass rounded-full p-4 text-white/80 hover:text-white hover:bg-white/10 transition-all">
            <Globe className="w-5 h-5" />
          </a>
        </div>
      </section>

      <AboutSection />
      <FeaturedVideoSection />
      <PhilosophySection />
      <ServicesSection />
    </div>
  );
}
