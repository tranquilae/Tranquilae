export interface MeditationTrack {
  title: string
  url: string
  duration?: number // seconds (optional)
  credit?: string
}

// CC0/royalty-free sample tracks (can be replaced in settings)
export const MEDITATION_LIBRARY: MeditationTrack[] = [
  {
    title: 'Deep Focus Ambient',
    url: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Monplaisir/Monplaisir_-_The_Sleepers/Monplaisir_-_01_-_Take_the_Time.mp3',
    credit: 'Monplaisir / FMA (CC0)'
  },
  {
    title: 'Calm Piano Reflections',
    url: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/Lee_Rosevere/Music_For_Teaspoons/Lee_Rosevere_-_06_-_Wonder_under.mp3',
    credit: 'Lee Rosevere / FMA (CC BY)'
  },
  {
    title: 'Ocean Waves',
    url: 'https://cdn.pixabay.com/download/audio/2021/11/15/audio_3b9b3e7a86.mp3?filename=ocean-waves-ambient-8776.mp3',
    credit: 'Pixabay (Free)'
  }
]

