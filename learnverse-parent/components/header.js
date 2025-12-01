import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  Laptop, 
  Shield, 
  Activity, 
  GraduationCap, 
  Menu, 
  ArrowRight, 
  X,
  Sparkles
} from 'lucide-react';

const Header = () => {
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect for header background
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent body scroll when overlay is open
  useEffect(() => {
    if (isOverlayOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOverlayOpen]);

  const navItems = [
    { 
      name: 'Boards', 
      icon: <GraduationCap className="w-6 h-6 mb-2" />, 
      href: '/upcoming',
      desc: 'Class 10th & 12th'
    },
    { 
      name: 'NEET UG', 
      icon: <Stethoscope className="w-6 h-6 mb-2" />, 
      href: 'https://learn.biologykingdom.ac',
      external: true,
      desc: 'Medical Entrance'
    },
    { 
      name: 'Nursing', 
      icon: <Activity className="w-6 h-6 mb-2" />, 
      href: '/upcoming',
      desc: 'B.Sc & Diploma'
    },
    { 
      name: 'Engineering', 
      icon: <Laptop className="w-6 h-6 mb-2" />, 
      href: '/upcoming',
      desc: 'JEE & State Exams'
    },
    { 
      name: 'Defence', 
      icon: <Shield className="w-6 h-6 mb-2" />, 
      href: '/upcoming',
      desc: 'NDA & CDS'
    },
  ];

  const toggleOverlay = () => setIsOverlayOpen(!isOverlayOpen);

  return (
    <>
      {/* --- Main Header --- */}
      <header 
        className={`fixed top-0 left-0 right-0 bg-gradient-to-br from-slate-50 via-emerald-50 to-sky-50 z-40 transition-all duration-300 ${
          scrolled 
            ? 'bg-white/90 backdrop-blur-md shadow-md ' 
            : 'bg-white  border-b border-transparent'
        }`}
      >
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
          
{/* Logo Section */}
<a href="/" className="flex items-center gap-2 group cursor-pointer">

  <div className="w-[125px] h-[75px] flex items-center justify-center">
    <img 
      src="/logobk.webp" 
      alt="Logo"
      className="w-[125px] h-[75px] object-contain block transition-transform group-hover:scale-110"
      onError={(e) => {
        e.target.onerror = null;
        e.target.src = 'https://via.placeholder.com/180x108?text=BK';
      }}
    />
  





            </div>
            
          </a>

          {/* Desktop Navigation (Quick Access) */}
<nav className="hidden lg:flex items-center space-x-10">
  {navItems.slice(0, 4).map((item) => (
    <a 
      key={item.name}
      href={item.external ? item.href : item.href}
      target={item.external ? "_blank" : "_self"}
      rel={item.external ? "noopener noreferrer" : ""}
      className="flex items-center gap-3 text-base font-semibold text-slate-700 hover:text-emerald-600 transition-colors"
    >
      {React.cloneElement(item.icon, { className: "w-6 h-6 text-emerald-500/90" })}
      {item.name}
    </a>
  ))}
</nav>


          {/* Actions: CTA & Hamburger */}
          <div className="flex items-center gap-3">
            {/* Start Learning CTA */}
            <button 
              onClick={toggleOverlay}
              className="hidden md:flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-emerald-600 to-sky-700 text-white font-semibold text-sm shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300 hover:-translate-y-0.5 transition-all duration-300"
            >
              <Sparkles className="w-4 h-4 text-yellow-300 fill-yellow-300" />
              Start Learning
            </button>

            {/* Mobile/Tablet Menu Button */}
            <button 
              onClick={toggleOverlay}
              className="lg:hidden p-2 text-slate-600 hover:text-emerald-600 transition-colors rounded-lg hover:bg-emerald-50"
              aria-label="Open Menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* --- The "Greatest" Overlay (Goal Selector) --- */}
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOverlayOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={toggleOverlay}
      ></div>

      {/* Sliding Panel */}
      <div 
        className={`fixed top-0 right-0 h-full z-50 w-full sm:w-[450px] bg-white shadow-2xl transform transition-transform duration-500 ease-out flex flex-col ${
          isOverlayOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Decorative background blob */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

        {/* Overlay Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between relative z-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Select Goal</h2>
            <p className="text-sm text-slate-500">What do you want to learn today?</p>
          </div>
          <button 
            onClick={toggleOverlay}
            className="p-2 rounded-full bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-red-500 transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {navItems.map((item, index) => (
              <a
                key={index}
                href={item.href}
                target={item.external ? "_blank" : "_self"}
                rel={item.external ? "noopener noreferrer" : ""}
                className="group relative flex flex-col items-start p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-300 hover:-translate-y-1"
                onClick={() => {
                  // Optional: Close overlay on click unless you want them to stay
                   if (!item.external) toggleOverlay();
                }}
              >
                {/* Icon Box */}
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-sky-50 text-emerald-600 group-hover:text-emerald-700 group-hover:from-emerald-100 group-hover:to-sky-100 transition-colors mb-3">
                  {item.icon}
                </div>
                
                {/* Text */}
                <h3 className="font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                  {item.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  {item.desc}
                </p>

                {/* Arrow */}
                <div className="mt-auto w-full flex justify-end">
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transform group-hover:translate-x-1 transition-all" />
                </div>
              </a>
            ))}
          </div>

          {/* Additional CTA inside Overlay for Mobile */}
          <div className="mt-8 p-4 rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 text-white text-center">
            <p className="text-sm font-medium opacity-90 mb-2">Not sure where to start?</p>
            <a href="/upcoming" onClick={toggleOverlay} className="text-emerald-400 text-sm hover:text-emerald-300 font-bold underline decoration-emerald-500/50 underline-offset-4 cursor-pointer">
              Explore all courses
            </a>
          </div>
        </div>

        {/* Overlay Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 text-center">
          <p className="text-xs text-slate-400">
            © BiologyKingdom. Empowering Education.
          </p>
        </div>
      </div>
    </>
  );
};

export default Header;