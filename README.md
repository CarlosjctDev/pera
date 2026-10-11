<div align="center">
	<img src="public/icono.png" alt="Logo de Pera" width="120" />
	<h1>Pera</h1>
	<p>Una aplicación personal para organizar tus finanzas desde el navegador.</p>
</div>

Pera permite registrar movimientos, consultar un resumen de tus finanzas y mantener tus datos organizados en un solo lugar. La interfaz está disponible en español e inglés e incluye modo claro, oscuro y automático.

## Funcionalidades

- **Panel financiero** para consultar información y movimientos.
- **Registro de movimientos** de ingresos, gastos, ahorros, inversiones y transferencias.
- **Cuentas y datos organizados** con categorías, contactos y tipos de relación.
- **Movimientos programados** para gestionar recurrencias.
- **Notas y archivos adjuntos** asociados a la información de la aplicación.
- **Copias de seguridad** locales, exportación e importación de datos.
- **Preferencias de idioma y tema**: español o inglés; claro, oscuro o según el sistema.
- **Almacenamiento local** en el navegador mediante IndexedDB y Dexie.
- **Configuración PWA** para ofrecer una experiencia instalable en navegadores compatibles.

> Los datos se guardan en el navegador de este dispositivo. Usa la función de copias de seguridad antes de borrar los datos del sitio o cambiar de dispositivo.

## Tecnologías

- [Angular](https://angular.dev/) 21
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Angular CDK](https://material.angular.dev/cdk/categories)
- [Dexie](https://dexie.org/) e IndexedDB
- [Bun](https://bun.sh/) como gestor de paquetes y scripts

## Requisitos

- [Bun](https://bun.sh/) 1.3 o posterior.
- Un navegador moderno con soporte para IndexedDB.

## Configuración de entorno

Actualmente el proyecto **no necesita un archivo `.env`**. La configuración se mantiene en los archivos de Angular:

- `src/environments/environment.development.ts`: configuración usada durante el desarrollo (`bun run start`).
- `src/environments/environment.ts`: configuración de producción, usada al compilar (`bun run build`).

Ambos definen el modo de ejecución, el nombre de la aplicación y su versión; esta última se obtiene de `package.json`. Si añades servicios externos, no guardes claves secretas en estos archivos: los valores del frontend quedan incluidos en el código entregado al navegador.

## Instalación y desarrollo

Clona el repositorio desde GitHub y ejecuta estos comandos desde la carpeta del proyecto:

```bash
bun install
bun run start
```

Abre [http://localhost:4200](http://localhost:4200). El servidor de desarrollo recarga la aplicación al detectar cambios en el código.

## Comandos disponibles

| Comando | Descripción |
| --- | --- |
| `bun run start` | Inicia el servidor de desarrollo de Angular. |
| `bun run build` | Genera la compilación de producción en `dist/`. |
| `bun run watch` | Compila en modo desarrollo y observa cambios. |
| `bun run test` | Ejecuta las pruebas unitarias una vez. |
| `bun run test:watch` | Ejecuta las pruebas y las vuelve a correr al detectar cambios. |

Las pruebas usan Vitest a través del builder de pruebas de Angular. GitHub Actions ejecuta las pruebas y la compilación en cada push y pull request.

## Compilación de producción

```bash
bun run build
```

Los archivos generados se guardan en `dist/`. La configuración PWA y el service worker se incluyen en la compilación de producción.

## Estructura general

- `src/app/core/`: componentes compartidos, navegación, idioma, tema y servicios comunes.
- `src/app/features/`: funcionalidades de perfil, panel, movimientos, datos maestros, notas, archivos adjuntos y configuración.
- `src/app/adapters/persistence/`: persistencia local y repositorios basados en Dexie.
- `public/`: iconos y recursos públicos de la aplicación.

## Contribuciones

Las propuestas y los reportes de errores son bienvenidos. Antes de enviar cambios, ejecuta `bun run test` y `bun run build`.
