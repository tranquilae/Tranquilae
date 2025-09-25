"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react"
import { MEDITATION_LIBRARY } from '@/data/meditations'

export function MeditationPlayer() {
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [currentTime, setCurrentTime] = React.useState(0)
  const [selected, setSelected] = React.useState(0)
  const audioRef = React.useRef<HTMLAudioElement | null>(null)
  const [duration, setDuration] = React.useState(0)
  const [volume, setVolume] = React.useState(0.8)

  const tracks = MEDITATION_LIBRARY
  const current = tracks[selected]

  const progress = duration ? (currentTime / duration) * 100 : 0

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const play = () => { audioRef.current?.play(); setIsPlaying(true) }
  const pause = () => { audioRef.current?.pause(); setIsPlaying(false) }
  const toggle = () => { isPlaying ? pause() : play() }
  const prev = () => { setSelected((s) => (s - 1 + tracks.length) % tracks.length); setCurrentTime(0) }
  const next = () => { setSelected((s) => (s + 1) % tracks.length); setCurrentTime(0) }

  React.useEffect(() => {
    const a = audioRef.current
    if (!a || !current) return
    const onTime = () => setCurrentTime(a.currentTime)
    const onLoaded = () => setDuration(a.duration || 0)
    const onEnd = () => next()
    a.addEventListener('timeupdate', onTime)
    a.addEventListener('loadedmetadata', onLoaded)
    a.addEventListener('ended', onEnd)
    a.volume = volume
    return () => {
      a.removeEventListener('timeupdate', onTime)
      a.removeEventListener('loadedmetadata', onLoaded)
      a.removeEventListener('ended', onEnd)
    }
  }, [selected])

  React.useEffect(() => { if (audioRef.current) audioRef.current.volume = volume }, [volume])

  // Early return if no current track is selected
  if (!current) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Guided Meditations</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">No meditation tracks available.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Guided Meditations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <audio ref={audioRef} src={current.url} preload="metadata" />

        {/* Now Playing */}
        <div className="text-center space-y-4 p-6 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">{current.title}</h2>
            <Badge variant="outline">Now Playing</Badge>
            {current.credit && <p className="text-xs text-muted-foreground">{current.credit}</p>}
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{duration ? formatTime(duration) : '--:--'}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button size="sm" variant="outline" onClick={prev}>
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button size="lg" onClick={toggle} className="rounded-full w-16 h-16">
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </Button>
            <Button size="sm" variant="outline" onClick={next}>
              <SkipForward className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => setVolume(v => Math.max(0, Math.min(1, v - 0.1)))}>
              <Volume2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Meditation Library */}
        <div className="space-y-3">
          <h3 className="font-medium text-muted-foreground">Library</h3>
          {tracks.map((t, index) => (
            <div
              key={index}
              onClick={() => { setSelected(index); setCurrentTime(0); setIsPlaying(false) }}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                index === selected ? "border-primary bg-primary/5" : "border-border/50 hover:bg-accent/20"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{t.title}</h4>
                  {t.credit && <p className="text-xs text-muted-foreground">{t.credit}</p>}
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="mb-1">
                    Audio
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
