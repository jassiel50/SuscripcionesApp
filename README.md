# Subly · SuscripcionesApp

> Todas tus suscripciones, un solo lugar. Controla cuánto gastas, cuándo te cobran y dónde puedes ahorrar.

App móvil (iOS / Android) hecha con **Expo SDK 57 + Expo Router + Firebase** para registrar suscripciones (Netflix, Spotify, ChatGPT, gimnasio…), ver el gasto mensual/anual, recibir recordatorios antes de cada cobro y vincular cada servicio a la tarjeta o CLABE con la que se paga.

**Modo claro** — Inicio, Estadísticas (arriba y con scroll: la tab bar se minimiza) y Perfil

![Modo claro](docs/screenshots/glass-light.jpg)

**Modo oscuro** — fondos profundos estilo Revolut; el Detalle se tiñe con el color de la marca

![Modo oscuro](docs/screenshots/glass-dark.jpg)

Lista con filtros, Calendario, Detalle (claro) y Calendario (oscuro)

![Mixto](docs/screenshots/glass-mix.jpg)

> Las capturas se tomaron en Chromium (build web) con datos de ejemplo. En iOS/Android se ven con la tipografía del sistema (SF Pro / Roboto).

---

## Índice

1. [Stack técnico](#1-stack-técnico)
2. [Cómo correrla](#2-cómo-correrla)
3. [Arquitectura](#3-arquitectura)
4. [Modelo de datos](#4-modelo-de-datos)
5. [Programación: módulos y convenciones](#5-programación-módulos-y-convenciones)
6. [Diseño: Subly Design System](#6-diseño-subly-design-system)
7. [Funcionamiento pantalla por pantalla](#7-funcionamiento-pantalla-por-pantalla)
8. [Qué cambió en el rediseño 2.0](#8-qué-cambió-en-el-rediseño-20)
9. [Deuda técnica y riesgos conocidos](#9-deuda-técnica-y-riesgos-conocidos)
10. [Roadmap: mejoras y nuevos módulos](#10-roadmap-mejoras-y-nuevos-módulos)

---

## 1. Stack técnico

| Capa | Tecnología | Para qué |
|---|---|---|
| Runtime | **Expo SDK 57**, React Native 0.86, React 19.2, Hermes | App nativa iOS/Android con un solo código |
| Navegación | **expo-router 57** (file-based) · `expo-router/js-tabs` | Rutas = archivos en `app/`, tabs con tab bar propia |
| Backend | **Firebase** 11 (Auth + Firestore) | Login y datos en la nube, en tiempo real (`onSnapshot`) |
| Auth | Google (`expo-auth-session`), Apple (`expo-apple-authentication`), Email/Password | Inicio de sesión |
| Notificaciones | `expo-notifications` (trigger `CALENDAR` repetitivo) | Recordatorio 1 día antes del cobro |
| UI | `expo-linear-gradient`, `react-native-svg`, `@expo/vector-icons` (Ionicons), `simple-icons` | Degradados de fondo, gráficas SVG, iconos y logos de marcas |
| Vidrio | `expo-glass-effect` (Liquid Glass iOS 26) · `expo-blur` (respaldo iOS < 26, Android y web) | Tab bar, barra superior, buscador y botones de vidrio |
| Animación | **Reanimated 4** (+ `react-native-worklets`) · `expo-haptics` | Springs en el hilo de UI, entradas escalonadas, gráficas que se dibujan, háptica |
| Persistencia local | `@react-native-async-storage/async-storage` | Sesión de Firebase y presupuesto |
| Otros | `@react-native-community/datetimepicker`, `expo-clipboard` | Fechas, copiar CLABE |
| Build | **EAS Build** (`eas.json`: development / preview / production) | Dev client y binarios de tienda |

---

## 2. Cómo correrla

```bash
npm install
npx expo start            # Expo Go o dev client
npx expo start --ios      # simulador iOS
npx expo start --android  # emulador Android
npx tsc --noEmit          # typecheck (debe salir limpio)
```

**Dev build** (necesario para Apple Sign-In real, NativeTabs y notificaciones completas):

```bash
eas build --profile development --platform ios
```

> `AGENTS.md` pide leer la documentación versionada de Expo antes de escribir código. El proyecto está en **SDK 57** (ver `package.json`); la guía apunta a v54, así que conviene actualizar ese enlace a `https://docs.expo.dev/versions/v57.0.0/`.

---

## 3. Arquitectura

### 3.1 Vista general

```mermaid
flowchart TB
  subgraph UI["UI · app/ (Expo Router)"]
    L[login.tsx]
    T["(tabs)/ · Inicio · Calendario · Estadísticas · Perfil"]
    C[catalog.tsx]
    N[subscription/new.tsx]
    D["subscription/[id].tsx"]
  end

  subgraph DS["Design System · src/components + src/theme"]
    TK[tokens.ts]
    UIK["ui/ · NotchCard · FilterPills · AreaChart · Gauge · Donut · SubscriptionRow…"]
    TB[FloatingTabBar]
  end

  subgraph STATE["Estado · src/hooks"]
    AU[useAuth]
    SP[SubscriptionsProvider / useSubscriptions]
    PC[usePaymentCards]
    NT[useNotifications]
    TH[useTheme]
  end

  subgraph DOMAIN["Dominio · src/utils"]
    DT["dates.ts · próxima fecha real, cobros por día/mes"]
    FM["format.ts · dinero MXN"]
    CT["catalog.ts · mapeo del catálogo"]
  end

  subgraph DATA["Datos"]
    FS[(Firestore users/uid/…)]
    FA[Firebase Auth]
    AS[(AsyncStorage)]
    OS[[Notificaciones del SO]]
    CAT[[constants/subscriptions.ts · catálogo MXN]]
  end

  UI --> DS
  UI --> STATE
  DS --> TH --> TK
  STATE --> DOMAIN
  UI --> DOMAIN
  AU --> FA
  SP --> FS
  SP --> AS
  PC --> FS
  NT --> OS
  C --> CAT
  N --> CAT
```

### 3.2 Capas

| Capa | Carpeta | Regla |
|---|---|---|
| **Rutas / pantallas** | `app/` | Una pantalla por archivo. Solo orquestan: leen hooks, calculan vistas con `useMemo` y componen componentes del design system. |
| **Design system** | `src/theme/`, `src/components/ui/` | Sin lógica de negocio ni acceso a datos. Todo color sale de `useTheme()`. |
| **Componentes de feature** | `src/components/` | `BudgetModal`, `CatalogBrowser`, `CardPickerModal`, `FloatingTabBar`: reutilizables entre pantallas y con algo de lógica. |
| **Estado / datos** | `src/hooks/`, `src/firebase/` | Los hooks exponen datos y acciones; `src/firebase/*` es el único lugar que habla con Firestore. |
| **Dominio puro** | `src/utils/` | Funciones puras (fechas, dinero, catálogo). Fáciles de probar con tests unitarios. |
| **Config** | `src/config/ui.ts`, `app.json`, `eas.json` | Flags de UI y configuración nativa. |

### 3.3 Estructura de carpetas

```
app/
├── _layout.tsx               # Stack raíz · AuthGate · SubscriptionsProvider · headers con tema
├── login.tsx                 # Google / Apple / Email
├── catalog.tsx               # Explorar catálogo (antes era pestaña)
├── (tabs)/
│   ├── _layout.tsx           # FloatingTabBar (default) o NativeTabs (opt-in)
│   ├── index.tsx             # Inicio
│   ├── calendar.tsx          # Calendario semana/mes
│   ├── explore.tsx           # Estadísticas
│   └── profile.tsx           # Perfil, tarjetas y ajustes
└── subscription/
    ├── new.tsx               # Alta (catálogo → formulario) y edición (?id=)
    └── [id].tsx              # Detalle
src/
├── theme/tokens.ts           # Colores, escenas de fondo, paleta vívida, radios, tipografía (SF Pro)
├── theme/motion.ts           # Springs, entradas, layout de listas y háptica
├── config/ui.ts              # USE_NATIVE_TABS
├── components/
│   ├── ui/                   # Design system: primitives, charts, glass, chrome (TopBar/scroll), NotchCard, SubscriptionTile
│   ├── FloatingTabBar.tsx
│   ├── BudgetModal.tsx
│   ├── CatalogBrowser.tsx
│   └── CardPickerModal.tsx
├── hooks/                    # useAuth, useSubscriptions, usePaymentCards, useNotifications, useTheme
├── firebase/                 # init + CRUD Firestore
├── utils/                    # dates, format, catalog, brandIcons, env
└── types/                    # Subscription, PaymentCard, labels y colores de categoría
constants/subscriptions.ts    # Catálogo de servicios con planes y precios MXN
```

### 3.4 Navegación

```
Stack (raíz)
├── login                         (fade, sin header)
├── (tabs)                        Tabs con FloatingTabBar
│   ├── index      Inicio
│   ├── calendar   Calendario
│   ├── [ + ]      FAB → /subscription/new
│   ├── explore    Estadísticas
│   └── profile    Perfil
├── catalog                       header "Explorar catálogo"
├── subscription/new              modal (catálogo → formulario)
└── subscription/[id]             detalle
```

**AuthGate** (`app/_layout.tsx`) escucha `onAuthStateChanged`: sin sesión → `/login`; con sesión en `/login` → `/`.

**Deep links de alta:** `/subscription/new?catalogId=netflix&planPrice=269&planPeriod=mensual` abre el formulario prellenado; `?custom=true` abre el formulario vacío; `?id=<docId>` edita.

### 3.5 Flujo de datos

```mermaid
sequenceDiagram
  participant UI as Pantalla
  participant P as SubscriptionsProvider
  participant FS as Firestore
  participant N as expo-notifications

  P->>FS: onSnapshot(users/{uid}/subscriptions)
  FS-->>P: docs (en tiempo real)
  P->>P: ordena por nextRenewalDate() · calcula monthlyTotal
  P-->>UI: subscriptions, monthlyTotal, yearlyTotal, budget
  UI->>P: add(sub)
  P->>FS: addDoc
  P->>N: scheduleNotificationAsync (CALENDAR repeats)
  P->>FS: updateDoc(notification_id)
  FS-->>P: snapshot actualizado → UI se re-renderiza sola
```

- **Una sola fuente de verdad:** Firestore. La UI nunca muta estado local de suscripciones; escribe en Firestore y el `onSnapshot` actualiza a todos.
- **Offline:** con la configuración actual (caché en memoria del SDK web de Firestore) las escrituras se encolan mientras la app sigue abierta y se sincronizan al volver la red; no hay caché persistente entre reinicios (ver roadmap).
- **Presupuesto:** vive en el provider y se persiste en AsyncStorage (`@subs_budget`), por lo que es por dispositivo (ver roadmap).

---

## 4. Modelo de datos

```
users/{uid}/subscriptions/{id}
users/{uid}/paymentCards/{id}
```

**Subscription**

| Campo | Tipo | Notas |
|---|---|---|
| `name` | string | "Netflix" |
| `price` | number | Precio **del ciclo** (mensual o anual) en MXN |
| `billing_cycle` | `'monthly' \| 'yearly'` | |
| `next_renewal` | `YYYY-MM-DD` | **Fecha ancla** capturada por el usuario. La fecha real se calcula con `nextRenewalDate()` |
| `category` | `entertainment \| productivity \| health \| education \| finance \| other` | |
| `color` | hex | Fallback cuando no hay logo de marca |
| `remind_me` | `0 \| 1` | |
| `notification_id` | string \| null | ID de la notificación programada en el dispositivo |
| `payment_method` | `credit_card \| debit_card \| paypal \| bank_transfer \| cash \| other` | |
| `card_id?` | string | Referencia a `paymentCards/{id}` |
| `description?` | string | Notas libres |
| `created_at` | ISO string | |

**PaymentCard**: `alias`, `kind` (`credit|debit|clabe`), `brand` (`visa|mastercard|amex|other`), `last_digits`, `clabe?` (18 dígitos), `bank`, `order?`, `created_at`.

**Catálogo** (`constants/subscriptions.ts`): lista estática de `PredefinedSubscription` con `planes[]` (`precio`, `periodo`, `precioMensual`, `descripcion`) en MXN.

### Reglas de Firestore recomendadas

Cada usuario solo debe poder leer/escribir su propio árbol:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

---

## 5. Programación: módulos y convenciones

### 5.1 Hooks

| Hook | Expone | Detalle |
|---|---|---|
| `useAuth()` | `{ user, loading }` | `undefined` mientras Firebase resuelve la sesión persistida |
| `useSubscriptions()` | `subscriptions`, `loading`, `monthlyTotal`, `yearlyTotal`, `budget`, `setBudget`, `add`, `update`, `remove`, `setNotifId` | Context global. Ordena por próximo cobro real. Siembra 3 ejemplos (MXN) en cuentas nuevas |
| `usePaymentCards()` | `cards`, `addCard`, `updateCard`, `removeCard` | Listener en `paymentCards` |
| `useScheduleNotification()` / `useCancelNotification()` | funciones | Trigger `CALENDAR` mensual (día) o anual (mes+día) a las 9:00, un día antes |
| `useTheme()` | `{ dark, colors }` | Tokens claro/oscuro según el sistema |
| `useTabBarSpace()` | número | Padding inferior para que el contenido no quede bajo la tab bar flotante |

### 5.2 Lógica de fechas (`src/utils/dates.ts`)

El punto más delicado de una app de suscripciones. Reglas:

- **Todo en hora local a mediodía** (`parseDate('2026-09-24')` → 12:00 local). `toISOString()` está prohibido para fechas: usa UTC y de noche cambia el día.
- **`nextRenewalDate(sub)`**: si la fecha ancla ya pasó, avanza mes a mes (o año a año) hasta hoy o después. Antes, una suscripción capturada hace 3 meses decía "Hoy" para siempre.
- **Fin de mes**: un cobro el día 31 cae el 30 en abril y el 28/29 en febrero (`withClampedDay`).
- **`chargesOn` / `subsOnDate` / `totalForMonth`**: base del calendario y de las gráficas; nunca marcan fechas anteriores a la ancla.
- **`monthlyEquivalent`**: anual / 12, para comparar peras con peras.

### 5.3 Dinero (`src/utils/format.ts`)

`money(1234.5)` → `$1,234.50` · `moneyShort` → `$1,235` · `moneyParts` separa enteros y centavos para los héroes (`$2,109` + `.92` pequeño). Todo en `es-MX` / MXN.

### 5.4 Convenciones

- TypeScript `strict`; `npx tsc --noEmit` debe pasar sin errores.
- Estilos con `StyleSheet.create` al final del archivo; colores **solo** desde `useTheme()` o tokens.
- Nada de `Dimensions` en render salvo grids con ancho fijo; preferir `flex` y `onLayout`.
- Componentes interactivos con `accessibilityRole` / `accessibilityLabel`.
- Textos de UI en español (MX).
- `src/firebase/*` es la única capa que importa `firebase/firestore`.

---

## 6. Diseño: Subly Glass

Tres referencias, tres cosas tomadas de cada una:

| Referencia | Qué se tomó |
|---|---|
| App de autos (Favourite) | Forma: tarjetas soft con radios grandes, tipografía pesada, pills de filtro y la **tarjeta con muesca** |
| Paleta blanco y negro | UI en **ink**: texto, botones, pills y tab bar en negro (blanco en oscuro) |
| **Revolut** | **Fondos con degradado vivo por pantalla, superficies de vidrio (Liquid Glass), tab bar compacta que se minimiza, saldo centrado, acciones rápidas redondas y la fluidez de las animaciones** |

### 6.1 Tokens (`src/theme/tokens.ts`)

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `scenes.*` | Pastel (lavanda, cielo, rosa) → `#F7F7FB` | Profundo (azul eléctrico, índigo, violeta) → `#05050C` | Degradado de fondo de cada pantalla (`home`, `calendar`, `stats`, `profile`, `neutral`) con dos fases que se funden |
| `surface` / `glass` | blanco 62–72 % | blanco 8–10 % | Tarjetas y vidrio translúcidos sobre el degradado |
| `glassBorder` / `cardBorder` | blanco 90 % | blanco 10–14 % | Borde fino que "recorta" el vidrio |
| `ink` / `onInk` | negro / blanco | blanco / negro | Énfasis: pill activa, botón "+", botones principales |
| `text` / `subtext` / `muted` | `#09090B` / `#5B5B66` / `#8E8E99` | blanco 100 / 68 / 45 % | Jerarquía de texto |
| `vivid` | 8 colores (índigo, rosa, ámbar, verde, cian, violeta, naranja, lima) | versiones más claras | **Color dinámico de datos**: categorías, métodos de pago |
| `chartLine` / `chartGood` / `chartWarn` / `chartBad` | degradados | degradados | Trazos de gráficas y medidores según el nivel (verde → ámbar → rojo) |
| `urgent` | `#DC2626` | `#F87171` | Cobro en ≤ 3 días o presupuesto excedido |

**Color dinámico:** además de la paleta, `brandColor()` (`src/utils/brandIcons.tsx`) toma el color real de la marca de cada suscripción (Netflix rojo, Spotify verde, Xbox verde, Claude naranja…) y lo usa en las barras del ranking, en los puntos del calendario, en el progreso de los tiles y para **teñir el fondo del Detalle**.

### Tipografía: una sola familia

`fontFamily` en tokens: **SF Pro** en iOS (`System`; SF Pro Text/Display según el tamaño), la sans del sistema en Android y la pila `-apple-system, "SF Pro", …, Arial` en web. Todas las cifras usan `tabular-nums` para que no "bailen" al animarse.

> SF Pro no se puede incluir en el binario de Android por licencia (solo plataformas Apple). Si se quiere exactamente la misma letra en Android, la alternativa libre más parecida es **Inter** (vía `@expo-google-fonts/inter`).

### Vidrio (`src/components/ui/glass.tsx`)

- `<Glass>`: en **iOS 26+** usa `GlassView` (Liquid Glass real, interactivo); en iOS anterior, Android (`blurMethod="dimezisBlurViewSdk31Plus"`) y web usa `BlurView` + capa translúcida + borde fino.
- `<ScreenBackground scene tint>`: dos degradados que se funden en loop de 9 s + un "orbe" de luz radial que flota. `tint` tiñe la escena (se usa con el color de marca en Detalle).

### Gráficas: sólo donde aportan

| Pantalla | ¿Gráfica? | Detalle |
|---|---|---|
| **Estadísticas** | Sí, a color | Curva de 12 meses con trazo índigo → rosa que **se dibuja**; medidores con degradado según el nivel (barrido animado); dona por categoría con segmentos que se despliegan; ranking con **el color de cada marca**; barra apilada por método de pago |
| **Inicio** | No | Saldo centrado grande, barra de presupuesto (verde/ámbar/rojo) y 3 cifras que cuentan hacia su valor |
| **Detalle** | No | Barra de progreso al siguiente cobro con el color de la marca y 3 cifras clave |
| **Calendario** | No | El calendario es la visualización; los puntos usan el color de la marca |

### 6.1b Movimiento (`src/theme/motion.ts`)

| Qué | Cómo |
|---|---|
| **Springs únicos** | `spring.snappy` (press), `spring.smooth` (tabs, chrome), `spring.gentle` (entradas). Todo corre en el hilo de UI con Reanimated 4 |
| **Entrada escalonada** | `enter(i)`: `FadeInDown` con spring y 55 ms de retraso por sección |
| **Listas que se reacomodan** | `listLayout` (`LinearTransition.springify()`) + `FadeIn/FadeOut` al filtrar o buscar |
| **Press** | `PressableScale`: escala + opacidad con spring y **háptica de selección** |
| **Tab bar** | Indicador que se desliza con spring; al hacer scroll hacia abajo **se minimiza** (etiquetas fuera, altura 62 → 48) y reaparece al subir (`useScreenScroll` + `ChromeProvider`) |
| **Barra superior** | Transparente arriba; al hacer scroll aparece el blur y el título compacto hace fade-in; el título grande se encoge con la inercia del scroll |
| **Parallax** | El saldo de Inicio se desvanece, baja y se encoge al hacer scroll (como el saldo de Revolut) |
| **Números** | `AnimatedNumber`: cuenta desde el valor anterior con ease-out |
| **Gráficas** | Línea con `strokeDashoffset`, medidores con barrido, dona con despliegue y barras que crecen (en web se muestran ya dibujadas) |
| **Fondo** | Degradados que se funden y orbe que flota, sin bloquear el hilo de JS |
| **Transiciones** | Tabs con `animation: 'shift'`; Stack `ios_from_right`; alta como modal `slide_from_bottom`; día del calendario con `ZoomIn` |
| **Háptica** | Selección (tabs, pills, días), impacto (botón "+", guardar) y éxito (guardado / eliminado) |
| **Skeletons** | Pulso suave mientras Firestore responde |

### 6.2 Componentes

| Componente | Descripción |
|---|---|
| `NotchCard` | Tarjeta con "mordida" cóncava arriba a la derecha dibujada en SVG (relleno de vidrio), donde vive un círculo ink (días restantes, editar). |
| `FloatingTabBar` | Píldora de **vidrio** con 4 pestañas (ícono + etiqueta), **indicador que se desliza** con spring, botón **"+" redondo** aparte y **minimizado al hacer scroll**. |
| `TopBar` / `LargeTitle` / `useScreenScroll` | Barra superior de vidrio que aparece con el scroll, título grande que se encoge y handler que alimenta a la tab bar. |
| `Glass` / `ScreenBackground` | Vidrio (Liquid Glass o blur) y fondo con degradado vivo. |
| `AnimatedNumber` / `Skeleton` / `ProgressBar` | Cifra que cuenta, placeholder con pulso y barra animada (sólida o degradado). |
| `FilterPills` | Pills estilo "All / New Car / Used Car": activa en ink, inactivas con contorno. |
| `AreaChart` | Curva suave (Catmull-Rom → Bézier) con trazo degradado de color que se dibuja, relleno y punto resaltado. |
| `Gauge` | Arco de 270° con trazo degradado y perilla que hace barrido animado. |
| `Donut` | Dona por categorías a color con puntas redondeadas que se despliega. |
| `SubscriptionRow` / `UpcomingTile` / `FeaturedSubscriptionCard` | Fila de lista con logo circular, tile del carrusel con barra de progreso del ciclo, tarjeta destacada con muesca. |
| `GradientButton`, `GradientCircle`, `IconButton`, `SearchField`, `Tag`, `SectionHeader`, `ScreenHeader`, `EmptyState`, `PressableScale` | Primitivas. `PressableScale` da micro-animación de escala al presionar. |

### 6.3 Principios UX aplicados

1. **Lo urgente primero:** Inicio abre con el gasto del mes, el próximo cobro destacado (con cuenta regresiva) y el carrusel de los próximos 14 días.
2. **Una acción principal siempre a la mano:** FAB central en todas las pestañas.
3. **El color significa algo:** la UI es blanco/negro; el color aparece en fondos (ambiente), en datos (gráficas, marcas, categorías) y el rojo sólo para urgencias.
4. **Números legibles:** cifras grandes, centavos pequeños, formato `es-MX`.
5. **Buscar y filtrar donde está la lista:** búsqueda + pills Todas/Mensuales/Anuales en Inicio.
6. **Modo oscuro** con fondos profundos estilo Revolut y vidrio oscuro; no es un simple invert.
7. **Movimiento con propósito:** todo lo que cambia se anima (nada "salta"), con springs cortos y háptica; los datos entran con coreografía.
8. **Accesibilidad:** roles y labels en botones y tabs; targets ≥ 44 pt.

### 6.4 Tab bar nativa (opcional)

`src/config/ui.ts → USE_NATIVE_TABS = true` usa las `NativeTabs` de expo-router en dev build (UITabBar del sistema). La tab bar propia ya usa Liquid Glass real en iOS 26 y se minimiza con el scroll, así que la opción nativa sólo conviene si se quiere el comportamiento 100 % del sistema (se pierde el botón "+").

---

## 7. Funcionamiento pantalla por pantalla

| Pantalla | Qué hace |
|---|---|
| **Login** | Google, Apple (iOS) y email/contraseña (registro, login, recuperar contraseña). Errores de Firebase traducidos. |
| **Inicio** | Barra superior de vidrio (avatar → Perfil, buscador, campana con aviso de urgentes); saldo mensual centrado que cuenta, chip de presupuesto y barra de nivel; 4 acciones rápidas redondas (Agregar, Calendario, Presupuesto, Explorar); 3 cifras; próximo cobro en `NotchCard`; carrusel de 14 días; lista filtrable que se reacomoda con animación. |
| **Calendario** | Vista semana o mes (lunes primero), puntos de color por cobro, total del mes, botón "Hoy", cobros del día seleccionado y resto del mes. Respeta recurrencia y fin de mes. |
| **FAB (+)** | Abre el alta: primero el catálogo (buscar, filtrar por categoría, elegir plan) o "Personalizada". |
| **Alta / edición** | Vista previa en vivo, precio grande en MXN, ciclo (muestra el equivalente mensual si es anual), fecha, categoría, color, recordatorio, método de pago, tarjeta/CLABE y notas. Al editar, reprograma la notificación. |
| **Detalle** | Fondo teñido con el color de la marca; tarjeta con muesca (editar); barra al siguiente cobro; cifras al mes / al año / % de tu gasto; **pagado aproximado**; detalles; tarjeta vinculada (copiar CLABE); eliminar con háptica de éxito. |
| **Estadísticas** | Gasto anual que cuenta + curva de 12 meses a color con mes más caro; medidores de presupuesto (verde/ámbar/rojo) y mensuales vs anuales; dona por categoría con barras por categoría; top 5 con colores de marca; barra apilada por método de pago; tips de ahorro con íconos a color. |
| **Perfil** | Usuario y proveedor de login, stats, tarjetas/CLABE (agregar, ordenar, eliminar, copiar), ajustes (estado **real** del permiso de notificaciones con acceso a Ajustes, presupuesto, moneda, apariencia) y cerrar sesión. |
| **Explorar catálogo** | Misma experiencia del paso 1 del alta, accesible desde Inicio. |

---

## 8. Qué cambió

### 3.0 — Subly Glass

- Fondos con degradado vivo por pantalla y superficies de vidrio (Liquid Glass en iOS 26, blur en el resto).
- Tab bar de vidrio con indicador deslizante, botón "+" aparte y minimizado con el scroll; barra superior con blur progresivo; títulos grandes que se encogen.
- Sistema de movimiento con Reanimated 4 (springs, entradas escalonadas, listas que se reacomodan, parallax, números que cuentan, gráficas que se dibujan) y háptica (`expo-haptics`).
- Estadísticas a color: paleta vívida por categoría, degradados según nivel y colores de marca dinámicos.
- Una sola familia tipográfica (SF Pro) con cifras tabulares.

### 2.x — Rediseño y paleta blanco y negro

**Diseño**
- Nuevo design system (`src/theme/tokens.ts` + `src/components/ui/`) y rediseño de **todas** las pantallas.
- Tab bar flotante, indicador animado y FAB central; "Explorar" pasa de pestaña a pantalla (`/catalog`) para dejar 4 pestañas + acción principal.
- Paleta **blanco y negro** con modo oscuro invertido; rojo solo para urgencias.
- `NotchCard`, gráfica de área, medidores y dona nuevos en SVG, usados sólo en Estadísticas.

**Bugs corregidos**
- **Fechas vencidas:** suscripciones con fecha ancla pasada mostraban "Hoy" para siempre y desaparecían de "Próximos pagos". Ahora se calcula la próxima fecha real (`nextRenewalDate`).
- **Planes anuales del catálogo** se guardaban con el precio *mensual* y ciclo *anual* (el gasto salía 12× más bajo). Ahora se guarda `plan.precio` anual.
- **Fecha por defecto** usaba `toISOString()` (UTC) y podía caer un día antes/después. Ahora es local.
- **Recordatorios:** no se programaban si faltaba menos de un día para el primer aviso aunque el trigger es repetitivo; ahora siempre se programan y usan la próxima fecha real.
- **Moneda inconsistente:** Perfil decía USD y las semillas estaban en dólares mientras el catálogo es MXN. Todo es MXN con `Intl` `es-MX`.
- **Botones sin acción** ("Ver todos", "Estadísticas", switch de notificaciones fijo en `true`) ahora navegan o reflejan el estado real.
- **Calendario y fin de mes:** un cobro del día 31 ahora aparece el último día de los meses cortos (antes esos meses no lo mostraban).
- Typecheck limpio: `tsconfig` apunta a los tipos RN de `@firebase/auth` (`getReactNativePersistence`).

**Limpieza**
- Eliminado código muerto del prototipo previo a Expo Router: `App.tsx`, `index.ts`, `src/screens/*`, `AddSubscriptionModal`, `SpendingCard`, `SubscriptionRow.*` y la capa SQLite (`src/db`), que nadie importaba (`main` es `expo-router/entry`).
- El catálogo duplicado en `new.tsx` y `discover.tsx` ahora es un solo componente: `CatalogBrowser`.
- `Tabs` se importa de `expo-router/js-tabs` (el export de `expo-router` está deprecado en SDK 57).

---

## 9. Deuda técnica y riesgos conocidos

| Tema | Riesgo | Sugerencia |
|---|---|---|
| Config de Firebase y client IDs de Google en código | Bajo (son públicos), pero sin reglas estrictas cualquiera podría escribir | Aplicar las reglas de la sección 4, activar **App Check**, mover a `app.config.ts` + variables `EXPO_PUBLIC_*` |
| Semillas automáticas | Una cuenta que borra todo recibe ejemplos otra vez al reabrir | Guardar un flag `users/{uid}.seeded = true` o quitar semillas y mejorar el onboarding |
| Presupuesto en AsyncStorage | No se sincroniza entre dispositivos | Moverlo a `users/{uid}` (doc de perfil) |
| Notificaciones locales | Si cambias de teléfono se pierden; día 31 mensual no dispara en meses cortos | Push desde Cloud Functions programadas (ver roadmap) |
| Precios del catálogo hardcodeados | Se desactualizan con cada alza | Catálogo remoto en Firestore / Remote Config |
| Sin tests ni lint | Regresiones silenciosas | Jest + `@testing-library/react-native` empezando por `utils/dates.ts`; ESLint `eslint-config-expo`; GitHub Actions |
| `expo-sqlite` sigue instalado | Peso extra en el binario | Quitar dependencia y plugin si no se usará modo offline propio |
| `@expo/ngrok` en dependencias | Solo es de desarrollo | Moverlo a `devDependencies` |

---

## 10. Roadmap: mejoras y nuevos módulos

Priorizado por impacto / esfuerzo. 🟢 rápido · 🟡 medio · 🔴 grande.

### 10.1 Quick wins 🟢

- **Shared element transition** del logo lista → detalle (Reanimated `sharedTransitionTag`).
- **Pull-to-refresh** con animación propia.
- **Gesto de arrastre** en la dona/curva para ver el valor de cada mes (Gesture Handler + Reanimated).
- **Recordatorio configurable**: 1, 3 o 7 días antes y hora preferida (guardado por suscripción).
- **Swipe actions** en la lista: pausar, editar, eliminar.
- **Estado "pausada"** (sin borrar historial) y estado **"prueba gratis"** con fecha de fin.
- **Onboarding** de 3 pasos (moneda, presupuesto, primeras suscripciones desde el catálogo).
- **Face ID / huella** para abrir la app (`expo-local-authentication`), útil porque guarda CLABEs.
- **Links de cancelación** por servicio en el catálogo ("¿Cómo cancelo Netflix?").

### 10.2 Módulos nuevos 🟡

| Módulo | Qué aporta |
|---|---|
| **Historial de pagos** | Subcolección `payments` (fecha, monto, método). Marcar "pagado", ver cuánto llevas gastado de verdad por servicio y por año. Base para reportes. |
| **Pruebas gratuitas (trials)** | Alta rápida de un trial con alerta 2 días antes de que empiece a cobrar. Es la función que más dinero ahorra. |
| **Suscripciones compartidas** | Dividir un plan familiar (Spotify Familiar, Netflix, Game Pass) entre personas: cuánto le toca a cada quien, quién ya pagó, recordatorio para cobrarles. Ideal para planes en pareja o con familia. |
| **Multi-moneda** | Muchos servicios (ChatGPT, Claude, Midjourney, iCloud en algunos casos) cobran en USD. Guardar `currency` por suscripción y convertir a MXN con tipo de cambio diario (API Banxico FIX). |
| **Tarjetas de crédito "a la mexicana"** | Fecha de corte y fecha límite de pago por tarjeta; ver qué suscripciones caen en cada corte y cuánto suman. |
| **Servicios del hogar** | Categorías y catálogo para Telcel, Izzi/Totalplay/Telmex, CFE, agua, gas, seguros, gimnasio, predial: la app pasa de "suscripciones digitales" a "todos mis cargos recurrentes". |
| **Metas y presupuesto por categoría** | Límite por categoría (entretenimiento ≤ $600) con gauges y alertas. |
| **Exportar / respaldar** | CSV y PDF mensual (`expo-print`, `expo-sharing`), útil para finanzas personales o impuestos. |
| **Alertas de aumento de precio** | Catálogo remoto con historial de precios; avisar "Netflix subió $20 a partir del próximo mes". |

### 10.3 Ecosistema Apple / Android 🟡🔴

- **Widgets** de iOS (WidgetKit) y Android: "próximo cobro" y "gasto del mes" en la pantalla de inicio. Con `expo-apple-targets` se escribe el widget en SwiftUI dentro del mismo repo.
- **Live Activity / Dynamic Island** el día del cobro.
- **App Intents / Siri Shortcuts**: "Oye Siri, ¿cuánto gasto en suscripciones?" y acciones en Atajos para automatizaciones.
- **Control Center / Lock Screen controls** (iOS 18+) para agregar una suscripción rápida.
- **Liquid Glass** (iOS 26): la opción `USE_NATIVE_TABS` ya existe; se puede extender `expo-glass-effect` a héroes y sheets en dev build.
- **Apple Watch complication** con el próximo cobro.

### 10.4 Automatización e IA 🔴

- **Detección automática desde el correo**: con la API de Gmail/Outlook leer recibos ("Your Netflix receipt") y proponer altas o actualizar precios. Requiere backend (Cloud Functions) y consentimiento explícito.
- **Open banking** (p. ej. Belvo en México) para detectar cargos recurrentes directamente del estado de cuenta.
- **Escaneo de recibos/estados de cuenta** con la cámara + OCR.
- **Asistente de ahorro con IA** (Claude API vía Cloud Function, nunca con la API key en la app): analiza tus suscripciones y sugiere qué cancelar, rotar o pasar a anual; redacta el correo de cancelación; responde "¿cuánto gasté en streaming este año?".
- **Categorización automática** de suscripciones personalizadas por nombre.

### 10.5 Backend y calidad 🟡

- **Cloud Functions programadas** para push notifications (FCM/APNs vía `expo-notifications` push tokens): recordatorios que sobreviven a cambios de teléfono y resumen semanal ("esta semana se cobran $807").
- **Perfil de usuario en Firestore** (`users/{uid}`): presupuesto, moneda, preferencias, flag de onboarding.
- **App Check + reglas de seguridad + índices** versionados en el repo (`firebase.json`, `firestore.rules`).
- **Tests**: unitarios para `dates.ts`/`format.ts`, de componentes para el design system y E2E con Maestro.
- **CI/CD**: GitHub Actions con `tsc`, lint y tests; **EAS Update** para OTA; **EAS Workflows** para builds automáticos por tag.
- **Observabilidad**: Sentry (`@sentry/react-native`) para crashes y performance; analytics de eventos clave (alta, cancelación, trial).
- **i18n** (`expo-localization` + `i18next`) si se quiere salir de México.
- **Misma fuente en Android**: si se quiere idéntica a iOS, empaquetar Inter (libre y muy parecida a SF Pro) sólo para Android.

---

Hecho con Expo · Firebase · mucho ☕ 🇲🇽
