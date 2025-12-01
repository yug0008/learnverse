// pages/index.js
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, ArrowRight, Star, Users, CheckCircle, Quote, Video, BookOpen, Calendar, ShieldQuestion, PenTool, Layout, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { supabase } from '../lib/supabase';



// Button Component
const Button = ({ children, variant = 'primary', className = '', icon, onClick }) => {
  const baseStyle = "px-5 py-2.5 rounded-full font-medium transition-all duration-300 flex items-center gap-2 relative overflow-hidden group text-sm";
  
  const variants = {
    primary: "bg-gradient-to-r from-emerald-600 to-sky-700 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 border border-transparent",
    secondary: "bg-white text-slate-800 shadow-md hover:shadow-lg border border-slate-100 hover:border-emerald-200",
    outline: "bg-transparent border-2 border-emerald-500 text-emerald-500 hover:bg-emerald-500/5",
    glass: "bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`${baseStyle} ${variants[variant]} ${className}`}
      onClick={onClick}
    >
      <span className="relative z-10 flex items-center gap-2">
        {children}
        {icon}
      </span>
      {variant === 'primary' && (
        <div className="absolute inset-0 bg-gradient-to-r from-sky-700 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
    </motion.button>
  );
};

// Banner Section
const Banner = () => {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('is_active', true)
        .order('position', { ascending: true });

      if (error) throw error;
      
      setBanners(data || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
      // Fallback banners
      setBanners([
        {
          id: 'fallback-1',
          image_url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3000&q=80',
          redirect_url: '/courses'
        },
        {
          id: 'fallback-2',
          image_url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3000&q=80',
          redirect_url: '/live-classes'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [banners]);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + banners.length) % banners.length);
  };

  const handleBannerClick = (url) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  if (!showBanner || banners.length === 0) return null;

  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-r from-slate-900 to-slate-800">
      {/* Close button */}
      <button
        onClick={() => setShowBanner(false)}
        className="absolute right-4 top-4 z-30 p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white/80 hover:text-white transition-all backdrop-blur-sm"
        aria-label="Close banner"
      >
        <X size={20} />
      </button>

      {/* Banner container */}
      <div className="relative aspect-[3.37/1] w-full max-h-[400px] group">
        {loading ? (
          <div className="w-full h-full bg-gradient-to-r from-slate-700 to-slate-600 animate-pulse flex items-center justify-center">
            <div className="text-white">Loading banner...</div>
          </div>
        ) : (
          <>
            {/* Banner Images */}
            {banners.map((banner, index) => (
              <motion.a
                key={banner.id}
                href={banner.redirect_url || '#'}
                onClick={(e) => {
                  e.preventDefault();
                  handleBannerClick(banner.redirect_url);
                }}
                className={`absolute inset-0 w-full h-full cursor-pointer transition-opacity duration-500 ${
                  index === currentIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                initial={false}
                animate={{ opacity: index === currentIndex ? 1 : 0 }}
                transition={{ duration: 0.5 }}
              >
                <img
                  src={banner.image_url}
                  alt="Promotional Banner"
                  className="w-full h-full object-cover object-center"
                  loading="eager"
                />
                {/* Overlay gradient for better visibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
              </motion.a>
            ))}

            {/* Navigation arrows */}
            {banners.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white/80 hover:text-white transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm z-20"
                  aria-label="Previous banner"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white/80 hover:text-white transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm z-20"
                  aria-label="Next banner"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            {/* Dots indicator */}
            {banners.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                {banners.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentIndex 
                        ? 'bg-white scale-125' 
                        : 'bg-white/50 hover:bg-white/80'
                    }`}
                    aria-label={`Go to banner ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Mobile responsive adjustments */}
      <style jsx>{`
        @media (max-width: 768px) {
          .aspect-[3.37/1] {
            aspect-ratio: 2/1;
          }
        }
        @media (max-width: 640px) {
          .aspect-[3.37/1] {
            aspect-ratio: 1.5/1;
          }
        }
      `}</style>
    </section>
  );
};

// Hero Section
const Hero = () => {
  return (
    <section className="relative min-h-screen pt-0 sm:pt-1 pb-16 overflow-hidden flex items-center justify-center bg-gradient-to-br from-slate-50 via-emerald-50 to-sky-50">
  {/* Enhanced Background Gradients */}
  <div className="absolute inset-0 pointer-events-none sm:pt-1">
    <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[100px] animate-pulse" />
    <div className="absolute top-[20%] right-[-5%] w-[400px] h-[400px] bg-sky-400/20 rounded-full blur-[80px] animate-pulse delay-1000" />
    <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-sky-500/15 rounded-full blur-[120px] animate-pulse delay-2000" />
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-r from-transparent via-emerald-200/5 to-transparent rounded-full" />
  </div>

  <div className="max-w-6xl mx-auto px-4 sm:px-6 w-full grid lg:grid-cols-2 gap-8 lg:gap-12 items-center relative z-10">
    {/* Left Content */}
    <motion.div 
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="space-y-4 sm:space-y-6 order-2 lg:order-1"
    >
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 border border-white/40 backdrop-blur-sm shadow-sm text-xs font-semibold text-emerald-600"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-600 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
        </span>
        #1 Personalized Learning Platform
      </motion.div>

      <motion.h1 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight sm:leading-tight text-slate-900 font-['Inter']"
      >
        Learn Smarter. <br />
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 via-sky-600 to-emerald-600 animate-gradient">
          Grow Faster.
        </span>
      </motion.h1>

      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-base sm:text-lg lg:text-xl text-slate-600 max-w-lg leading-relaxed font-['Inter']"
      >
        Experience the future of education with adaptive AI curriculums, 
        immersive live classes, and a community of global learners at biologykingdom.
      </motion.p>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex flex-wrap items-center gap-3"
      >
        <Button variant="primary" icon={<ArrowRight size={18} />}>
          Start Learning
        </Button>
        <Button variant="secondary" icon={<Play size={18} className="opacity-70" />}>
          Watch Demo
        </Button>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex items-center gap-4 sm:gap-6 pt-4"
      >
        <div className="flex -space-x-2">
          {[1, 2, 3, 4].map((i) => (
            <motion.img 
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 + (i * 0.1) }}
              src={`https://picsum.photos/seed/${i + 50}/80/80`} 
              alt="Student" 
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white shadow-lg" 
            />
          ))}
          <motion.div 
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.1 }}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 border-2 border-white shadow-lg"
          >
            +2k
          </motion.div>
        </div>
        <div>
          <div className="flex items-center gap-1 text-yellow-500 mb-1">
            {[1,2,3,4,5].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2 + (i * 0.1) }}
              >
                <Star size={12}  fill="currentColor" />
              </motion.div>
            ))}
          </div>
          <p className="text-xs text-slate-500 font-['Inter']">Trusted by 10,000+ students</p>
        </div>
      </motion.div>
    </motion.div>

    {/* Right 3D Illustration - Mobile: Below left content, Desktop: Side by side */}
    <motion.div 
      initial={{ opacity: 0, y: 50, rotateX: 10, rotateY: -10 }}
      animate={{ opacity: 1, y: 0, rotateX: 0, rotateY: 0 }}
      transition={{ duration: 1, delay: 0.2 }}
      className="relative perspective-1000 order-1 lg:order-2 mb-8 lg:mb-0"
    >
      {/* Main Dashboard Card */}
      <motion.div 
        animate={{ y: [0, -12, 0] }}
        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
        className="relative bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl p-4 sm:p-6 shadow-xl shadow-emerald-500/20 transform lg:rotate-y-3 lg:rotate-x-3 z-20 w-full max-w-sm mx-auto scale-95 sm:scale-100"
      >
        {/* Fake UI Content */}
        <div className="flex justify-between items-center mb-4">
          <div className="space-y-1">
            <div className="h-1.5 w-12 sm:w-16 bg-slate-800/10 rounded"></div>
            <div className="h-3 w-20 sm:w-28 bg-slate-800/20 rounded font-semibold text-slate-700 text-xs sm:text-sm">biologykingdom Pro</div>
          </div>
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-sky-600 shadow-lg"></div>
        </div>
        
        <div className="space-y-3">
          {/* Progress Chart Mock */}
          <div className="h-20 sm:h-24 rounded-lg bg-gradient-to-r from-emerald-50 to-sky-50 border border-white/40 flex items-end justify-between p-2 sm:p-3 px-3 sm:px-4">
            {[40, 70, 50, 90, 60, 80].map((h, i) => (
              <motion.div 
                key={i} 
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                className="w-1.5 sm:w-2 bg-gradient-to-t from-emerald-500 to-sky-500 rounded-t opacity-80 shadow-lg"
              />
            ))}
          </div>

          {/* List items */}
          <div className="space-y-2">
            {[1, 2].map(i => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/60 hover:bg-white/80 transition-colors border border-white/40">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
                  <CheckCircle size={14}  />
                </div>
                <div className="flex-1">
                  <div className="h-1.5 w-16 sm:w-20 bg-slate-800/20 rounded mb-1.5"></div>
                  <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-sky-500 w-2/3 rounded-full shadow-lg"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Floating Elements - Hidden on small mobile, shown on larger */}
        <motion.div 
          animate={{ y: [0, -16, 0] }}
          transition={{ repeat: Infinity, duration: 5, delay: 1 }}
          className="hidden sm:block absolute -right-8 lg:-right-10 top-6 lg:top-8 bg-white p-2 sm:p-3 rounded-xl shadow-xl flex items-center gap-2 z-30 border border-white/40"
        >
          <div className="bg-green-100 p-1 sm:p-1.5 rounded-lg text-green-600 shadow-sm">
            <Users size={14}  />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold">Live Class</p>
            <p className="text-sm font-bold text-slate-800">Physics 101</p>
            <p className="text-xs text-red-500 flex items-center gap-1 font-semibold">● Live Now</p>
          </div>
        </motion.div>

        <motion.div 
          animate={{ y: [0, 12, 0] }}
          transition={{ repeat: Infinity, duration: 7, delay: 0.5 }}
          className="hidden sm:block absolute -left-5 lg:-left-6 bottom-12 lg:bottom-16 bg-white/90 backdrop-blur p-2 rounded-xl shadow-lg z-30 flex items-center gap-1.5 border border-white/40"
        >
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 flex items-center justify-center text-white text-xs font-bold shadow-lg">A+</div>
          <span className="text-sm font-bold text-slate-700">Exam Passed!</span>
        </motion.div>
      </motion.div>
    </motion.div>
  </div>
</section>
  );
};

// Features Section
const Features = () => {
  const features = [
    { title: 'Live Classes', description: 'Real-time interactive learning with top educators.', icon: Video, color: 'text-red-500' },
    { title: 'Recorded Lessons', description: 'Access unlimited library of high-quality recordings.', icon: BookOpen, color: 'text-emerald-500' },
    { title: 'Smart Planner', description: 'AI-driven study scheduler to keep you on track.', icon: Calendar, color: 'text-green-500' },
    { title: 'Instant Doubts', description: 'Get your questions answered instantly by experts.', icon: ShieldQuestion, color: 'text-sky-500' },
    { title: 'Mock Tests', description: 'Practice to perfection with detailed analysis.', icon: PenTool, color: 'text-orange-500' },
    { title: 'Revision Notes', description: 'Concise, high-impact notes for quick revision.', icon: Layout, color: 'text-teal-500' },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-slate-50 via-emerald-50 to-sky-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-white to-transparent z-10" />
      <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-slate-50 to-transparent z-10" />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-20">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 font-['Inter']">
            Why Choose <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-sky-600">biologykingdom</span>?
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-['Inter']">
            We provide a comprehensive ecosystem designed to maximize your learning potential 
            through cutting-edge technology and expert guidance.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ 
                y: -8, 
                scale: 1.02,
                transition: { duration: 0.2 } 
              }}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl hover:shadow-emerald-300 transition-all duration-300 border border-slate-100 group relative overflow-hidden"
            >
              {/* Background Gradient on Hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-sky-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative z-10">
                <div className={`w-12 h-12 rounded-xl bg-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg ${feature.color} bg-opacity-5 group-hover:bg-opacity-10`}>
                  <feature.icon size={24} className={feature.color} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3 font-['Inter'] group-hover:text-slate-800 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-slate-600 leading-relaxed font-['Inter'] group-hover:text-slate-700 transition-colors">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Educators Section
const Educators = () => {
  const educators = [
    { 
      id: '1', 
      name: 'Dr. Yogesh Jindal', 
      subject: 'Biology', 
      students: '50k+', 
      courses: 12, 
      image: 'https://picsum.photos/seed/eleanor/200/200' 
    },
    { 
      id: '2', 
      name: 'Prof. Radhika Sharma', 
      subject: 'Physics', 
      students: '42k+', 
      courses: 8, 
      image: 'https://picsum.photos/seed/jamesk/200/200' 
    },
    { 
      id: '3', 
      name: 'Dr. Anil Verma', 
      subject: 'Mathematics', 
      students: '35k+', 
      courses: 15, 
      image: 'https://picsum.photos/seed/maria/200/200' 
    },
    { 
      id: '4', 
      name: 'Prof. Meera Nair', 
      subject: 'Chemistry', 
      students: '60k+', 
      courses: 20, 
      image: 'https://picsum.photos/seed/kenji/200/200' 
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-slate-50 via-emerald-50 to-sky-50 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4"
        >
          <div className="flex-1">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3 font-['Inter']">
              World-Class <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-sky-600">Educators</span>
            </h2>
            <p className="text-lg text-slate-600 max-w-xl font-['Inter']">
              Learn from industry experts and experienced educators who are passionate about your success.
            </p>
          </div>
          <Button variant="outline" className="whitespace-nowrap text-sm">
            View All Mentors
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {educators.map((edu, index) => (
            <motion.div
              key={edu.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              className="group text-center relative"
            >
              <div className="relative w-40 h-40 mx-auto mb-4">
                {/* Gradient Background */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-emerald-500 to-sky-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-lg scale-110" />
                
                {/* Image Container */}
                <div className="relative w-full h-full rounded-full p-1.5 bg-white border-2 border-slate-100 group-hover:border-transparent transition-all duration-300 shadow-lg group-hover:shadow-xl group-hover:shadow-emerald-300">
                  <img 
                    src={edu.image} 
                    alt={edu.name} 
                    className="w-full h-full rounded-full object-cover shadow-inner" 
                  />
                </div>
                
                {/* Course Badge */}
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full px-2 py-1 shadow-lg border border-slate-100">
                  <span className="text-xs font-bold text-slate-700">{edu.courses} courses</span>
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-emerald-600 transition-colors font-['Inter']">
                {edu.name}
              </h3>
              <p className="text-slate-500 mb-3 text-sm font-['Inter']">{edu.subject}</p>
              
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full text-xs font-semibold shadow-md border border-slate-100 group-hover:shadow-lg group-hover:border-emerald-200 transition-all">
                <Users size={14} className="text-emerald-500" />
                <span className="text-slate-700">{edu.students}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Testimonials Section
const Testimonials = () => {
  const testimonials = [
    {
      name: "Arjun Mehta",
      role: "JEE Aspirant",
      text: "biologykingdom ke lectures aur practice system ne meri preparation ka level hi change kar diya. 3D explanations ne Physics ko itna easy bana diya jitna kabhi socha nahi tha.",
      img: "https://picsum.photos/seed/alex/150/150"
    },
    {
      name: "Saniya Khan",
      role: "NEET Aspirant",
      text: "AI planner ne mujhe daily routine manage karne me bahut help ki. Pehle confusion hoti thi, ab har subject time pe complete hota hai. Biology diagrams yahan next-level hain!",
      img: "https://picsum.photos/seed/sarahlee/150/150"
    },
    {
      name: "Rohit Singh",
      role: "Railway Aspirant",
      text: "biologykingdom sirf padhai nahi, ek proper guidance system deta hai. Clean UI, smart tests, aur detailed analysis ne meri speed & accuracy dono improve ki.",
      img: "https://picsum.photos/seed/david/150/150"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-slate-50 via-emerald-50 to-sky-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_#000_1px,_transparent_0)] bg-[length:40px_40px]" />
      </div>
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 font-['Inter']">
            Loved by <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-sky-600">Learners</span>
          </h2>
          <p className="text-lg text-slate-600 max-w-xl mx-auto font-['Inter']">
            Join thousands of successful students who transformed their learning journey with biologykingdom
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              whileHover={{ y: -6 }}
              className="bg-white p-6 rounded-2xl shadow-lg shadow-slate-200/40 border border-slate-100 flex flex-col relative group hover:shadow-xl hover:shadow-emerald-300 transition-all duration-300"
            >
              {/* Quote Icon */}
              <div className="absolute top-4 right-4 text-emerald-500 opacity-10 group-hover:opacity-20 transition-opacity">
                <Quote size={48} />
              </div>
              
              <div className="mb-4 text-emerald-500 opacity-80">
                <Quote size={24} />
              </div>
              
              <p className="text-slate-600 mb-6 flex-1 leading-relaxed font-['Inter'] group-hover:text-slate-700 transition-colors">
                "{t.text}"
              </p>
              
              <div className="flex items-center gap-3">
                <img 
                  src={t.img} 
                  alt={t.name} 
                  className="w-12 h-12 rounded-full object-cover shadow-lg border-2 border-white group-hover:border-emerald-200 transition-colors" 
                />
                <div>
                  <h4 className="font-bold text-slate-900 font-['Inter']">{t.name}</h4>
                  <p className="text-slate-500 text-sm font-['Inter']">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Main Home Component
export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Banner />
      <Hero />
      <Features />
      <Educators />
      <Testimonials />
    </div>
  );
}