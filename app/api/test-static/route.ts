import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const publicPath = path.join(process.cwd(), 'public')
    const logoPath = path.join(publicPath, 'logo.svg')
    
    console.log('Public path:', publicPath)
    console.log('Logo path:', logoPath)
    console.log('Logo exists:', fs.existsSync(logoPath))
    
    const files = fs.readdirSync(publicPath)
    console.log('Files in public:', files.slice(0, 5))
    
    return NextResponse.json({
      publicPath,
      logoPath,
      logoExists: fs.existsSync(logoPath),
      files: files.slice(0, 10),
      cwd: process.cwd()
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      cwd: process.cwd()
    }, { status: 500 })
  }
}
