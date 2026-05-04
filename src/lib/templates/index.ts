import sitioWeb from './sitio-web'
import landing from './landing'
import branding from './branding'
import productoDigital from './producto-digital'
import audiovisual from './audiovisual'
import vacio from './vacio'

export const TEMPLATES = [sitioWeb, landing, branding, productoDigital, audiovisual]
export const ALL_TEMPLATES = [...TEMPLATES, vacio]
