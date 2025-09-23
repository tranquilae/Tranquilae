"use client"

import Image from 'next/image'
import { Logo } from '@/components/logo'

export default function TestImagesPage() {
  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Image Test Page</h1>
      
      <div className="space-y-4">
        <h2 className="text-xl">Regular img tag:</h2>
        <img 
          src="/logo.svg" 
          alt="Tranquilae" 
          className="h-12 w-auto border border-red-500"
        />
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl">Next.js Image component (unoptimized):</h2>
        <Image 
          src="/logo.svg" 
          alt="Tranquilae" 
          width={200}
          height={50}
          className="border border-blue-500"
          unoptimized
        />
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl">Our Logo component:</h2>
        <div className="border border-green-500 inline-block p-2">
          <Logo className="h-12" />
        </div>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl">Test simple SVG:</h2>
        <img 
          src="/test.svg" 
          alt="Test SVG" 
          className="h-12 w-auto border border-purple-500"
        />
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl">File exists check:</h2>
        <p>If you can see this text but not the images above, there's an issue with the SVG file or serving.</p>
        <div className="space-y-2">
          <a href="/logo.svg" target="_blank" className="block text-blue-500 underline">
            Click here to try accessing logo.svg directly
          </a>
          <a href="/test.svg" target="_blank" className="block text-blue-500 underline">
            Click here to try accessing test.svg directly
          </a>
          <a href="/favicon.svg" target="_blank" className="block text-blue-500 underline">
            Click here to try accessing favicon.svg directly
          </a>
        </div>
      </div>
    </div>
  )
}
