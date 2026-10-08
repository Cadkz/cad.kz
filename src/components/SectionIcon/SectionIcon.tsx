import {
  Building2,
  Cog,
  Columns3,
  Droplet,
  FileText,
  GraduationCap,
  Image,
  Layers,
  type LucideIcon,
  Monitor,
  Printer,
  Route,
  ScanLine,
  Wrench,
} from 'lucide-react'

const icons: Record<string, LucideIcon> = {
  building: Building2,
  columns: Columns3,
  layers: Layers,
  route: Route,
  wrench: Wrench,
  droplet: Droplet,
  cog: Cog,
  image: Image,
  file: FileText,
  scan: ScanLine,
  printer: Printer,
  monitor: Monitor,
  graduation: GraduationCap,
}

type Props = { name?: string | null; size?: 16 | 20 | 24; className?: string }

/** Иконка раздела каталога по ключу из CMS (поле «Иконка» у раздела). */
export function SectionIcon({ name, size = 20, className }: Props) {
  const Icon = (name && icons[name]) || Building2
  return <Icon size={size} strokeWidth={1.75} className={className} aria-hidden="true" />
}
