// Módulos de la aplicación: se usan en el menú lateral, en el panel de inicio y en las rutas.
export const MODULOS = [
  {
    id: 'personas',
    ruta: '/personas',
    label: 'Personas',
    icono: 'users',
    descripcion: 'Registro de visitas, miembros y su etapa.',
  },
  {
    id: 'seguimientos',
    ruta: '/seguimientos',
    label: 'Seguimientos',
    icono: 'message',
    descripcion: 'Contactos pastorales y su resultado.',
  },
  {
    id: 'grupos',
    ruta: '/grupos',
    label: 'Grupos',
    icono: 'layers',
    descripcion: 'Células, redes y ministerios.',
  },
  {
    id: 'familias',
    ruta: '/familias',
    label: 'Familias',
    icono: 'heart',
    descripcion: 'Núcleos familiares y parentescos.',
  },
  {
    id: 'reuniones',
    ruta: '/reuniones',
    label: 'Reuniones',
    icono: 'calendar',
    descripcion: 'Servicios, eventos y asistencia.',
  },
  {
    id: 'usuarios',
    ruta: '/usuarios',
    label: 'Usuarios y Roles',
    icono: 'shield',
    descripcion: 'Cuentas de acceso y permisos.',
    soloAdmin: true,
  },
]

export function modulosVisibles(esAdmin) {
  return MODULOS.filter((m) => !m.soloAdmin || esAdmin)
}
