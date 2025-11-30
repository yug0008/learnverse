import Head from "next/head";
import { motion } from "framer-motion";

export default function Upcoming() {
  return (
    <>
      <Head>
        <title>Upcoming · biologykingdom</title>
      </Head>

      <div className="min-h-screen flex flex-col items-center justify-center p-6">

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="p-10 rounded-3xl shadow-xl border border-gray-200 max-w-md w-full bg-white"
        >
          <motion.div
            initial={{ rotate: -20, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ duration: 0.7 }}
            className="flex justify-center mb-6"
          >
            <img 
              src="/logobk.webp" 
              alt="biologykingdom" 
              className="w-28 h-auto object-contain"
            />
          </motion.div>

          <h1 className="text-3xl font-extrabold text-orange-900 text-center mb-3">
            Page Under Construction 🚧
          </h1>

          <p className="text-center text-orange-900/90 leading-relaxed">
            This page is currently being built with love, precision and the best UI possible.
            Stay tuned — something amazing is coming soon!
          </p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 flex justify-center"
          >
            <div className="animate-spin w-10 h-10 border-4 border-orange-900 border-t-transparent rounded-full"></div>
          </motion.div>
        </motion.div>

      </div>
    </>
  );
}
