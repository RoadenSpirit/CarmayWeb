# Guía de Vercel Agent Skills (Habilidades para Agentes de IA)

Esta guía explica qué es **Vercel Agent Skills**, cómo se instala a nivel de proyecto y cómo utilizar el comando `npx skills` para equipar a tus agentes de IA con capacidades y flujos de trabajo especializados en cualquiera de tus repositorios.

---

## 1. ¿Qué es Vercel Agent Skills?

**Vercel Agent Skills** es un ecosistema abierto de paquetes modulares y reutilizables diseñados para extender las capacidades de los agentes de codificación de IA (como Claude Code, Cursor, Copilot, Cline, etc.). 

Cada "Skill" contiene:
* **Instrucciones específicas (system prompts)** para enseñar al agente cómo realizar tareas complejas paso a paso.
* **Esquemas de herramientas (tool schemas)** que el agente puede usar para interactuar con APIs externas, bases de datos o sistemas de archivos.
* **Plantillas de código y buenas prácticas** del dominio correspondiente.

Las habilidades se publican en repositorios de GitHub (por ejemplo, `owner/repo`) y se gestionan a través de una herramienta CLI llamada `skills`.

---

## 2. Instrucciones de Instalación y Uso

Para permitir que cada proyecto instale únicamente las habilidades que necesite de manera modular, utilizaremos el comando bajo demanda mediante `npx`. No es necesario instalar globalmente el paquete, lo que mantiene el entorno limpio.

### A. Agregar una habilidad a un proyecto
Para instalar una habilidad en el directorio del proyecto actual, abre la terminal en la raíz del proyecto y ejecuta:

```bash
npx skills add <owner/repo>
```

*Por ejemplo, para agregar las habilidades oficiales de Vercel:*
```bash
npx skills add vercel-labs/agent-skills
```

### B. Instalar una habilidad específica de un repositorio
Si un repositorio contiene múltiples habilidades y solo quieres una de ellas, usa el flag `--skill`:

```bash
npx skills add <owner/repo> --skill <nombre-de-la-habilidad>
```

### C. Listar habilidades disponibles en un repositorio
Puedes ver qué habilidades ofrece un repositorio sin tener que instalarlas ejecutando:

```bash
npx skills add <owner/repo> --list
```

### D. Buscar habilidades públicas
Puedes explorar las habilidades disponibles en la comunidad ejecutando:

```bash
npx skills find <término-de-búsqueda>
```
*(También puedes explorar la lista completa en la web oficial [skills.sh](https://skills.sh))*

---

## 3. ¿Dónde se guardan y cómo las leen los agentes?

Cuando ejecutas `npx skills add`, la herramienta crea una carpeta oculta en la raíz del proyecto actual (o en el directorio del agente de tu sistema) dependiendo de tu editor o agente de IA:
* Para agentes basados en la CLI o configuraciones del sistema, suele guardarse en `.agents/skills/` o carpetas similares dentro del proyecto.
* El agente leerá automáticamente los archivos `.md` de estas carpetas para comprender las nuevas herramientas e instrucciones disponibles.

Esta estructura modular te permite tener un proyecto de WooCommerce con habilidades de optimización web, y otro proyecto con habilidades de despliegue en la nube, sin mezclar configuraciones.
