// components/header.js
import { useState, useEffect } from 'react';
import React from "react";

import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaTimes, 
  FaInstagram, 
  FaYoutube, 
  FaLinkedin, 
  FaTwitter,
  FaGraduationCap,
  FaStethoscope,
  FaTrain,
  FaUserTie,
  FaChalkboardTeacher
} from 'react-icons/fa';

const Header = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const navigationItems = [
    { 
      name: 'Engineering', 
      href: 'https://engineering.learnverse.com',
      icon: <FaGraduationCap className="w-5 h-5" />
    },
    { 
      name: 'Medical', 
      href: 'https://medical.learnverse.com',
      icon: <FaStethoscope className="w-5 h-5" />
    },
    { 
      name: 'Railway', 
      href: 'https://railway.learnverse.com',
      icon: <FaTrain className="w-5 h-5" />
    },
    { 
      name: 'SSC', 
      href: 'https://ssc.learnverse.com',
      icon: <FaUserTie className="w-5 h-5" />
    },
    { 
      name: 'Boards', 
      href: 'https://boards.learnverse.com',
      icon: <FaChalkboardTeacher className="w-5 h-5" />
    }
  ];

  useEffect(() => {
    const handleScroll = () => {
      // Set scrolled state when user scrolls past 10px for smoother transition
      setIsScrolled(window.scrollY > 10);
    };
    
    // Initial check
    handleScroll();
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

const GoalSelectionModal = () => (
  <AnimatePresence>
    {isModalOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 backdrop-blur-lg p-5 sm:p-4"
        onClick={() => setIsModalOpen(false)}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25 }}
          className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl 
                     p-5 sm:p-6 md:p-8 mx-auto w-full 
                     max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-4xl 
                     shadow-2xl max-h-[90vh] overflow-y-auto mt-6 sm:mt-0"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <motion.button
            onClick={() => setIsModalOpen(false)}
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 text-white/60 hover:text-white transition-colors duration-200 p-2 rounded-xl bg-white/10 hover:bg-white/20 z-10"
          >
            <FaTimes className="w-4 h-4 sm:w-5 sm:h-5" />
          </motion.button>

          {/* Title */}
          <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-white text-center mb-4 sm:mb-8 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent px-2">
            Select Your Goal
          </h2>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 md:gap-6">
            {navigationItems.map((item, index) => (
              <motion.a
                key={item.name}
                href={item.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{
                  scale: window.innerWidth >= 640 ? 1.05 : 1.02,
                  y: window.innerWidth >= 640 ? -5 : -2,
                  transition: { type: "spring", stiffness: 400, damping: 17 }
                }}
                whileTap={{ scale: 0.95 }}
                className="group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg 
                           border border-white/10 rounded-xl sm:rounded-2xl 
                           p-3 sm:p-6 text-center cursor-pointer shadow-lg hover:shadow-xl 
                           hover:border-blue-400/30 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Icon */}
                <div className="relative z-10 flex justify-center mb-2 sm:mb-4">
                  <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl sm:rounded-2xl group-hover:scale-110 transition-transform duration-300">
                    {React.cloneElement(item.icon, {
                      className: "w-4 h-4 sm:w-5 sm:h-5"
                    })}
                  </div>
                </div>

                {/* Text */}
                <h3 className="text-sm sm:text-lg md:text-xl font-semibold text-white relative z-10 mb-1 sm:mb-2">
                  {item.name}
                </h3>
                <p className="text-blue-200/60 text-xs sm:text-sm relative z-10">
                  Start your journey
                </p>
              </motion.a>
            ))}
          </div>

          {/* Close */}
          <div className="mt-5 sm:mt-8 text-center">
            <motion.button
              onClick={() => setIsModalOpen(false)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-5 py-2 bg-white/20 backdrop-blur-sm border border-white/30 
                         text-white rounded-2xl font-medium text-sm sm:text-base hover:bg-white/30 transition-all duration-300"
            >
              Close
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

  const MobileMenu = () => (
    <AnimatePresence>
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 lg:hidden bg-black/60 backdrop-blur-lg"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 25 }}
            className="absolute right-0 top-0 h-full w-80 bg-white/95 backdrop-blur-xl border-l border-slate-200/20 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 pt-20 h-full flex flex-col">
              {/* Close Button */}
              <motion.button
                onClick={() => setIsMobileMenuOpen(false)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="absolute top-6 right-6 text-slate-600 hover:text-slate-800 p-2 rounded-xl bg-slate-100 hover:bg-slate-200"
              >
                <FaTimes className="w-5 h-5" />
              </motion.button>

              {/* Logo */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center mb-8"
              >
                <img 
                  src="/logolv.png" 
                  alt="LearnVerse" 
                  width={120}
                  height={41}
                  className="object-contain"
                />
              </motion.div>

              {/* Navigation Links */}
              <div className="space-y-3 flex-1">
                {navigationItems.map((item, index) => (
                  <motion.a
                    key={item.name}
                    href={item.href}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ x: 10 }}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-3 py-4 px-6 text-slate-700 text-lg font-medium rounded-2xl bg-gradient-to-r from-transparent to-blue-500/10 hover:to-blue-500/20 transition-all duration-300 border border-transparent hover:border-blue-400/30 group"
                  >
                    <div className="text-blue-500 group-hover:scale-110 transition-transform duration-300">
                      {item.icon}
                    </div>
                    <span>{item.name}</span>
                  </motion.a>
                ))}
              </div>

              {/* Get Started Button */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                onClick={() => {
                  setIsModalOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <span>Get Started</span>
                <FaGraduationCap className="w-4 h-4" />
              </motion.button>

              {/* Social Links */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex justify-center space-x-4 mt-8 pt-6 border-t border-slate-200/20"
              >
                {[
                  { icon: <FaInstagram className="w-5 h-5" />, href: '#' },
                  { icon: <FaYoutube className="w-5 h-5" />, href: '#' },
                  { icon: <FaLinkedin className="w-5 h-5" />, href: '#' },
                  { icon: <FaTwitter className="w-5 h-5" />, href: '#' }
                ].map((social, index) => (
                  <motion.a
                    key={index}
                    href={social.href}
                    whileHover={{ scale: 1.2, y: -2 }}
                    whileTap={{ scale: 0.9 }}
                    className="text-slate-500 hover:text-blue-500 transition-colors duration-200 p-2 rounded-xl bg-slate-100 hover:bg-slate-200"
                  >
                    {social.icon}
                  </motion.a>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className={`fixed top-0 left-0 right-0 z-30 transition-all duration-500 ease-out ${
          isScrolled 
            ? 'bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-sm py-3' 
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Logo with Image */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-3"
            >
              <img 
                src="/logolv.png" 
                alt="LearnVerse" 
                width={160}
                height={55}
                className={`object-contain hidden lg:block transition-all duration-500 ${
                  isScrolled ? 'filter-none' : 'brightness-0 invert'
                }`}
              />
              <img 
                src="/logolv.png" 
                alt="LearnVerse" 
                width={120}
                height={41}
                className={`object-contain lg:hidden transition-all duration-500 ${
                  isScrolled ? 'filter-none' : 'brightness-0 invert'
                }`}
              />
              <div className={`w-2 h-2 rounded-full animate-pulse hidden lg:block transition-colors duration-500 ${
                isScrolled ? 'bg-blue-500' : 'bg-white'
              }`} />
            </motion.div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              {navigationItems.map((item) => (
                <motion.a
                  key={item.name}
                  href={item.href}
                  whileHover={{ 
                    y: -2,
                    transition: { type: "spring", stiffness: 400, damping: 17 }
                  }}
                  className={`relative font-medium transition-all duration-500 group flex items-center space-x-2 ${
                    isScrolled 
                      ? 'text-slate-700 hover:text-blue-600' 
                      : 'text-white hover:text-white/90'
                  }`}
                >
                  <div className={`group-hover:scale-110 transition-transform duration-300 ${
                    isScrolled ? 'text-blue-500' : 'text-white'
                  }`}>
                    {item.icon}
                  </div>
                  <span>{item.name}</span>
                  <motion.div
                    className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r group-hover:w-full transition-all duration-300 ${
                      isScrolled 
                        ? 'from-blue-400 to-purple-400' 
                        : 'from-white to-white/80'
                    }`}
                    initial={false}
                  />
                </motion.a>
              ))}
            </nav>

            {/* Desktop CTA */}
            <div className="hidden lg:flex items-center space-x-4">
              <motion.button
                onClick={() => setIsModalOpen(true)}
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 0 30px rgba(59, 130, 246, 0.4)"
                }}
                whileTap={{ scale: 0.95 }}
                className={`px-6 py-2.5 rounded-2xl font-semibold transition-all duration-500 relative overflow-hidden flex items-center space-x-2 ${
                  isScrolled 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:shadow-xl' 
                    : 'bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 hover:border-white/40'
                }`}
              >
                <span className="relative z-10">Get Started</span>
                <FaGraduationCap className="w-4 h-4 relative z-10" />
                {isScrolled && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 opacity-0 hover:opacity-100 transition-opacity duration-300"
                    whileHover={{ opacity: 1 }}
                  />
                )}
              </motion.button>
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`lg:hidden p-3 rounded-2xl backdrop-blur-sm border transition-all duration-500 ${
                isScrolled 
                  ? 'bg-white/80 border-slate-200/50 text-slate-700' 
                  : 'bg-white/10 border-white/20 text-white'
              }`}
            >
              <div className="w-6 h-6 flex flex-col justify-center space-y-1">
                <motion.span
                  animate={isMobileMenuOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
                  className={`block h-0.5 w-6 rounded-full transition-colors duration-500 ${
                    isScrolled ? 'bg-slate-700' : 'bg-white'
                  }`}
                />
                <motion.span
                  animate={isMobileMenuOpen ? { opacity: 0 } : { opacity: 1 }}
                  className={`block h-0.5 w-6 rounded-full transition-colors duration-500 ${
                    isScrolled ? 'bg-slate-700' : 'bg-white'
                  }`}
                />
                <motion.span
                  animate={isMobileMenuOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
                  className={`block h-0.5 w-6 rounded-full transition-colors duration-500 ${
                    isScrolled ? 'bg-slate-700' : 'bg-white'
                  }`}
                />
              </div>
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Modals */}
      <GoalSelectionModal />
      <MobileMenu />

      {/* Spacer */}
      <div className="h-20 lg:h-24" />
    </>
  );
};

export default Header;