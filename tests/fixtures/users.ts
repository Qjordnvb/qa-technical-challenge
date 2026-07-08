/**
 * Catálogo de usuarios de SauceDemo y su comportamiento esperado.
 *
 * SauceDemo inyecta bugs intencionales según el usuario. Modelamos aquí lo que
 * DEBERÍA pasar (contrato) para que los specs afirmen el comportamiento correcto;
 * los usuarios rotos harán fallar esos specs y quedan documentados como defectos.
 */

export const PASSWORD = 'secret_sauce';

export type Persona = {
  username: string;
  /** Descripción del defecto conocido, si aplica. */
  knownDefect?: string;
};

export const USERS = {
  standard: { username: 'standard_user' },
  locked: { username: 'locked_out_user' },
  problem: {
    username: 'problem_user',
    knownDefect:
      'Imágenes de producto idénticas, ordenamiento inoperante y campos de checkout defectuosos.',
  },
  performanceGlitch: {
    username: 'performance_glitch_user',
    knownDefect: 'Latencia artificial elevada al cargar páginas.',
  },
  error: {
    username: 'error_user',
    knownDefect: 'Errores intermitentes en carrito/checkout y ordenamiento.',
  },
  visual: {
    username: 'visual_user',
    knownDefect: 'Defectos visuales: elementos desalineados / íconos incorrectos.',
  },
} satisfies Record<string, Persona>;

/** Personas que deben poder recorrer todo el flujo sin defectos. */
export const HEALTHY_USERS: Persona[] = [USERS.standard];

/** Personas con defectos intencionales (usadas en personas.spec.ts). */
export const DEFECTIVE_USERS: Persona[] = [
  USERS.problem,
  USERS.performanceGlitch,
  USERS.error,
  USERS.visual,
];

/** Datos de checkout válidos reutilizables. */
export const VALID_CHECKOUT = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  postalCode: '28001',
};
