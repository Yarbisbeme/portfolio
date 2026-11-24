#!/bin/bash
# "Ignored Build Step" de Vercel: exit 0 = omitir el deploy, exit 1 = construir.
#
# En main solo se publica el commit que deja el pipeline de e2e con los resultados
# frescos ("chore(automation): ..."). Así cada push publica una sola vez, ya probado,
# y /automation siempre muestra la ejecución de esa misma versión.
# Las demás ramas (vistas previas de PR) se construyen siempre.

if [[ "$VERCEL_GIT_COMMIT_REF" != "main" ]]; then
  exit 1
fi

if [[ "$VERCEL_GIT_COMMIT_MESSAGE" == chore\(automation\)* ]]; then
  exit 1
fi

echo "Commit en main sin resultados e2e: se publicará cuando termine el pipeline."
exit 0
