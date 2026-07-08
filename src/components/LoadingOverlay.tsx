'use client'

import { Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  isLoading: boolean
  message?: string
}

export default function LoadingOverlay({ isLoading, message = 'Procesando...' }: Props) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/60 backdrop-blur-md print:hidden"
        >
          <div className="relative flex flex-col items-center">
            {/* Círculos de animación de fondo */}
            <div className="absolute h-32 w-32 animate-ping rounded-full bg-blue-400/20" />
            <div className="absolute h-24 w-24 animate-pulse rounded-full bg-blue-600/10" />
            
            {/* Spinner Principal */}
            <div className="relative rounded-3xl bg-white p-8 shadow-2xl border border-gray-100">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="text-blue-600"
              >
                <Loader2 size={48} strokeWidth={2.5} />
              </motion.div>
            </div>
            
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-6 text-lg font-black uppercase tracking-widest text-blue-900"
            >
              {message}
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
