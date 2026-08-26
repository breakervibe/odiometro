# Sitio del Odiómetro

Sitio estático de cuatro páginas que enmarca el tablero. Sin herramientas de
compilación: se abre, se edita y se sirve tal cual.

```bash
python -m http.server -d sitio 8000
```

## Estructura

| Archivo | Qué es |
|---|---|
| `index.html` | Home · tres preguntas en scroll-snap, una por pantalla |
| `metodologia.html` | Diez secciones con índice pegajoso y glosario en acordeón |
| `odiometro.html` | Página del tablero · lo embebe sin modificarlo |
| `quienes-somos.html` | Equipo, aliados y las tres vías de contacto |
| `css/tokens.css` | **Único sitio donde vive el color y la tipografía** |
| `css/fuentes.css` | Las tres familias, autoalojadas en `fonts/` |
| `tablero/` | Copia del tablero (`web/`) para que comparta origen con el sitio |

## De dónde sale el diseño

- **Estructura y copy** — artifact *Wireframes aprobados* (`a0ece6c9`). Todo lo
  que es dato estructural (las siete categorías, las cinco bandas, los cuatro
  pesos del índice, las tres condiciones del control) va literal y no debe
  cambiar sin actualizar `docs/propuesta.md`.
- **Paleta y tipografía** — artifact *Color + type pairing* (`1b86b7f0`).
  Morado `#7a3d94` como primario, durazno `#fbd2c6` como único acento.
  Schibsted Grotesk para titulares, Atkinson Hyperlegible Next para el cuerpo,
  IBM Plex Mono para etiquetas y datos.

Las fuentes están **autoalojadas** a propósito: el sitio se ve igual sin
conexión, lo que importa cuando se presenta desde una sala ajena.

## El tablero

`odiometro.html` embebe `tablero/index.html` en un iframe a
`calc(100vh - altura de nav)`. El tablero no se toca por estilo: su CSS ya
declara que pinta todo su color explícitamente «para que la página se sostenga
sobre cualquier fondo anfitrión».

En pantallas de menos de 900 px el iframe se oculta y se ofrece un enlace para
abrir el tablero aparte. Un tablero de una pantalla no cabe en un teléfono.

### Mantener la copia al día

`tablero/` es una **copia** de `web/`. Después de cada ciclo:

```bash
python scripts/publicar_sitio.py
```

No se apuntó `config.WEB` a `sitio/tablero` porque `web/auditoria.html` lee del
mismo directorio y se quedaría sin su `auditoria_muestra.json`.

## Dos correcciones al tablero

Ambas en `web/index.html`, con copia de seguridad en `web/index.html.bak`.

**La ventana de arranque ya no puede ser una que no midió nada.** Abría en
«1 día», donde `estado.series` viene entero a `null` porque la clasificación va
por detrás de la recolección: siete «sin medición» seguidos y el banner de traza
ilustrativa. Ahora arranca en la ventana más amplia **con** magnitud —hoy,
15 días— y los botones reflejan la elegida. Las otras ventanas siguen a un clic
y siguen diciendo «sin medición» cuando toca.

**La canaleta del sismógrafo pasó de 78 a 104 px.** Las etiquetas de banda se
dibujan alineadas a la derecha en `GUT - 11`, y a 12 px monoespaciados
«Hostigamiento» se salía del lienzo: el eje decía «tigamiento» y «nchamiento».

## Lo que falta

Marcado en pantalla con el estilo `.pendiente`, para que no se cuele a
producción sin querer:

1. **Antecedentes (§09)** — qué se toma exactamente de HODIO, FARO, Hatemeter,
   NDI y ONU Mujeres.
2. **Control de calidad (§07)** — el enlace «Ver últimos valores» necesita que
   exista la auditoría manual.
3. **Equipo** — nombres, cargos, fotos y biografías.
4. **Aliados y financiamiento** — logos, fuentes y montos declarados.
5. **Formulario de contacto** — no envía a ningún sitio; falta destino y
   política de datos.
6. **La fecha «Actualizado» de la home está a mano.** El dato real vive en
   `estado.json`, pero leerlo desde la home costaría descargar 1,1 MB para
   pintar ocho caracteres.

## Estados obligatorios del tablero

Los wireframes fijan tres, y el tablero actual cumple el primero:

1. **Sin medición** — «—», nunca 0,0. El cero sería una medición real de cero.
2. **Periodo desactivado** — un periodo sin datos no se puede clicar. Hoy se
   cumple sólo para `disponible: false` (30 días), no para un periodo
   disponible pero sin clasificar.
3. **Tablero sin actualizar** — sigue navegable, pero fechado. La cabecera del
   tablero ya dice «sin actualizar · último cierre».

## El rediseño pendiente del tablero

La página 03 del wireframe **no es** el tablero que existe. Describe otro:
filtro de fechas, siete tarjetas monitoreada/control en orden alfabético y
popup por par. El sitio embebe el actual —el que tiene datos reales— y el
rediseño queda para después de la presentación.
