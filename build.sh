#!/bin/bash

# Ruta al archivo package.json
PACKAGE_JSON="./package.json"

# Extraer la versión actual
CURRENT_VERSION=$(grep -Po '(?<="version": ")[^"]*' $PACKAGE_JSON)

# Separar los números de versión en partes
IFS='.' read -r -a VERSION_PARTS <<< "$CURRENT_VERSION"

# Incrementar la última parte de la versión
((VERSION_PARTS[2]++))

# Crear la nueva versión
NEW_VERSION="${VERSION_PARTS[0]}.${VERSION_PARTS[1]}.${VERSION_PARTS[2]}"

# Reemplazar la versión en package.json
sed -i -E "s/\"version\": \"[^\"]+\"/\"version\": \"$NEW_VERSION\"/" $PACKAGE_JSON

echo "Versión actualizada de $CURRENT_VERSION a $NEW_VERSION"

# Construir el proyecto
npm run build

# Empaquetar el proyecto
npm pack
