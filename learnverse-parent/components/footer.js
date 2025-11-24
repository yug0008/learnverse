// components/footer.js
import { useState } from 'react';
import { 
  FaInstagram, 
  FaYoutube, 
  FaLinkedin, 
  FaTwitter,
  FaGraduationCap,
  FaStethoscope,
  FaTrain,
  FaUserTie,
  FaChalkboardTeacher,
  FaRocket,
  FaHeart,
  FaRegEnvelope
} from 'react-icons/fa';

const Footer = () => {
  const [openSections, setOpenSections] = useState({});
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const toggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const footerData = {
    categories: {
      title: 'Learning Paths',
      icon: <FaGraduationCap className="w-4 h-4" />,
      links: [
        { 
          name: 'Engineering', 
          href: 'https://engineering.learnverse.com',
          icon: <FaGraduationCap className="w-4 h-4" />,
          color: 'from-blue-500 to-cyan-500'
        },
        { 
          name: 'Medical', 
          href: 'https://medical.learnverse.com',
          icon: <FaStethoscope className="w-4 h-4" />,
          color: 'from-green-500 to-emerald-500'
        },
        { 
          name: 'Railway', 
          href: 'https://railway.learnverse.com',
          icon: <FaTrain className="w-4 h-4" />,
          color: 'from-orange-500 to-red-500'
        },
        { 
          name: 'SSC', 
          href: 'https://ssc.learnverse.com',
          icon: <FaUserTie className="w-4 h-4" />,
          color: 'from-purple-500 to-pink-500'
        },
        { 
          name: 'Boards', 
          href: 'https://boards.learnverse.com',
          icon: <FaChalkboardTeacher className="w-4 h-4" />,
          color: 'from-indigo-500 to-blue-500'
        }
      ]
    },
    company: {
      title: 'Company',
      icon: <FaRocket className="w-4 h-4" />,
      links: [
        { name: 'About Us', href: '/about', description: 'Our story' },
        { name: 'Careers', href: '/careers', description: 'Join us' },
        { name: 'Blog', href: '/blog', description: 'Latest updates' },
        { name: 'Press', href: '/press', description: 'Media kit' }
      ]
    },
    support: {
      title: 'Support',
      icon: <FaHeart className="w-4 h-4" />,
      links: [
        { name: 'Help Center', href: '/help', description: 'Get help' },
        { name: 'Contact Us', href: '/contact', description: 'Reach out' },
        { name: 'Refund Policy', href: '/refund-policy', description: 'Money back' },
        { name: 'Privacy Policy', href: '/privacy-policy', description: 'Your data' },
        { name: 'Terms of Service', href: '/terms', description: 'Legal stuff' }
      ]
    },
    connect: {
      title: 'Connect',
      icon: <FaRegEnvelope className="w-4 h-4" />,
      links: [
        { name: 'Instagram', href: 'https://instagram.com/learnverse', icon: 'Instagram', description: 'Follow us' },
        { name: 'YouTube', href: 'https://youtube.com/learnverse', icon: 'YouTube', description: 'Watch us' },
        { name: 'LinkedIn', href: 'https://linkedin.com/company/learnverse', icon: 'LinkedIn', description: 'Connect' },
        { name: 'Twitter', href: 'https://twitter.com/learnverse', icon: 'Twitter', description: 'Tweet us' }
      ]
    }
  };

  const SocialIcon = ({ platform, className = "w-5 h-5" }) => {
    const icons = {
      Instagram: <FaInstagram className={className} />,
      YouTube: <FaYoutube className={className} />,
      LinkedIn: <FaLinkedin className={className} />,
      Twitter: <FaTwitter className={className} />
    };

    return icons[platform] || null;
  };

  const FooterSection = ({ title, links, icon, isMobile = false }) => (
    <div className="space-y-4">
      {isMobile ? (
        <button
          onClick={() => toggleSection(title)}
          className="flex items-center justify-between w-full text-left py-4 border-b border-white/10 group"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl text-white">
              {icon}
            </div>
            <span className="text-white font-semibold text-lg group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400 group-hover:bg-clip-text transition-all duration-300">
              {title}
            </span>
          </div>
          <div className={`w-6 h-6 text-white/60 group-hover:text-white transition-colors duration-300 transform ${openSections[title] ? 'rotate-180' : ''}`}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
      ) : (
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl text-white shadow-lg">
            {icon}
          </div>
          <h3 className="text-white font-bold text-xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            {title}
          </h3>
        </div>
      )}

      {(isMobile ? openSections[title] : true) && (
        <div className={`space-y-3 ${isMobile ? 'pb-6' : ''}`}>
          {links.map((link, index) => (
            <div key={link.name} className="group">
              <a
                href={link.href}
                className="flex items-center space-x-3 p-3 rounded-2xl bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-transparent hover:border-white/20 transition-all duration-300 group"
              >
                {link.color ? (
                  <div className={`p-2 bg-gradient-to-r ${link.color} rounded-xl text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {link.icon}
                  </div>
                ) : link.icon ? (
                  <div className="p-2 bg-gradient-to-r from-gray-600 to-gray-700 rounded-xl text-white/80 group-hover:text-white group-hover:from-blue-500 group-hover:to-purple-500 transition-all duration-300">
                    <SocialIcon platform={link.icon} className="w-4 h-4" />
                  </div>
                ) : null}
                
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-300 group-hover:to-purple-300 group-hover:bg-clip-text transition-all duration-300">
                    {link.name}
                  </div>
                  {link.description && (
                    <div className="text-white/40 text-sm group-hover:text-white/60 transition-colors duration-300">
                      {link.description}
                    </div>
                  )}
                </div>
                
                <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const NewsletterSignup = () => {
    const handleSubmit = (e) => {
      e.preventDefault();
      setIsSubscribed(true);
      setTimeout(() => setIsSubscribed(false), 3000);
      setEmail('');
    };

    return (
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/10 backdrop-blur-xl p-8">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5" />
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-4">
            <FaRegEnvelope className="w-6 h-6 text-blue-400" />
            <h3 className="text-white font-bold text-xl">Stay Updated</h3>
          </div>
          <p className="text-white/60 mb-6">
            Get the latest updates on courses, features, and learning tips.
          </p>
          
          {isSubscribed ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaHeart className="w-6 h-6 text-white" />
              </div>
              <p className="text-white font-semibold">Welcome to the LearnVerse family! 🎉</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:border-blue-400/50 transition-colors duration-300 backdrop-blur-sm"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2 group"
              >
                <span>Subscribe</span>
                <FaRocket className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    );
  };

  return (
    <footer className="relative overflow-hidden bg-gradient-to-b from-[#0A0F1C] to-[#050811] border-t border-white/5">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-40 left-20 w-36 h-36 bg-cyan-500/10 rounded-full blur-3xl" />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-16 lg:py-20">
          {/* Top Section with Logo and Newsletter */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16">
            {/* Brand Section */}
            <div className="lg:col-span-1 space-y-6">
              <div className="flex items-center space-x-4">
                <img 
                  src="/logolv.png" 
                  alt="LearnVerse" 
                  width={180}
                  height={62}
                  className="object-contain brightness-0 invert"
                />
                <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full" />
              </div>
              
              <p className="text-white/60 text-lg leading-relaxed font-light">
                Empowering millions of learners worldwide with cutting-edge education technology and immersive learning experiences.
              </p>
              
              <div className="flex space-x-3">
                {footerData.connect.links.map((social, index) => (
                  <a
                    key={social.name}
                    href={social.href}
                    className="p-3 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl text-white/60 hover:text-white transition-all duration-300 group"
                  >
                    <SocialIcon platform={social.icon} className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                  </a>
                ))}
              </div>
            </div>

            {/* Newsletter */}
            <div className="lg:col-span-2">
              <NewsletterSignup />
            </div>
          </div>

          {/* Navigation Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Desktop Columns */}
            <div className="hidden lg:grid lg:grid-cols-3 lg:col-span-3 gap-8">
              <FooterSection {...footerData.categories} />
              <FooterSection {...footerData.company} />
              <FooterSection {...footerData.support} />
            </div>

            {/* Connect Section */}
            <div className="lg:col-span-1">
              <FooterSection {...footerData.connect} />
            </div>

            {/* Mobile Accordion */}
            <div className="lg:hidden space-y-2 col-span-1">
              <FooterSection {...footerData.categories} isMobile={true} />
              <FooterSection {...footerData.company} isMobile={true} />
              <FooterSection {...footerData.support} isMobile={true} />
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 py-8 flex flex-col lg:flex-row justify-between items-center space-y-6 lg:space-y-0">
          <p className="text-white/40 text-sm font-light flex items-center space-x-2">
            <span>© {new Date().getFullYear()} LearnVerse. Crafted with</span>
            <FaHeart className="w-3 h-3 text-red-400" />
            <span>for the future of education.</span>
          </p>
          
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((item) => (
              <a
                key={item}
                href={`/${item.toLowerCase().replace(' ', '-')}`}
                className="text-white/40 hover:text-white transition-all duration-300 font-light"
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;