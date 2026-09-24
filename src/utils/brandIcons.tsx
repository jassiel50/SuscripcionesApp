import React from 'react';
import { Text, View, useColorScheme } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import {
  // Streaming
  siNetflix, siHbo, siMax, siYoutube, siTwitch, siCrunchyroll,
  siPrimevideo, siAmazonprime,
  // Música
  siSpotify, siApplemusic, siDeezer, siTidal, siSoundcloud,
  // Apple
  siApple, siAppletv, siIcloud,
  // Google
  siGoogle, siGoogledrive,
  // Microsoft / Gaming
  siXbox, siMicrosoft, siSteam, siEpicgames, siEa,
  siPlaystation, siNintendo, siNintendoswitch,
  // Productividad
  siNotion, siDropbox, siZoom, siAsana, siJira, siTrello,
  siGithub, siDiscord, siFigma, siShopify, siWordpress,
  // IA / Otros
  siOpenai, siNordvpn, siDuolingo, siAmazon,
} from 'simple-icons';

// ─────────────────────────────────────────────────────────────────────────────
// Tipo base
// ─────────────────────────────────────────────────────────────────────────────

export interface SimpleIcon { path: string; hex: string }

// ─────────────────────────────────────────────────────────────────────────────
// Paths manuales — marcas eliminadas del paquete npm pero disponibles en web
// Para agregar más: simpleicons.org → busca → "Copy SVG" → extrae el d="..."
// ─────────────────────────────────────────────────────────────────────────────

const MANUAL: Record<string, SimpleIcon> = {
  // Claude (Anthropic) — hex oficial D97757
  'claude': {
    hex: 'D97757',
    path: 'm4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z',
  },
  // HBO Max — hex 000000
  'hbomax': {
    hex: '000000',
    path: 'M3.784 8.716c-.655 0-1.32.29-2.173.946v-.78H0v6.236h1.715V11.24c.749-.592 1.091-.78 1.372-.78.333 0 .551.209.551.729v3.928h1.715V11.23c.748-.582 1.081-.769 1.372-.769.333 0 .55.208.55.728v3.928H8.99v-4.53c0-1.403-.8-1.871-1.57-1.871-.654 0-1.32.27-2.192.936-.28-.697-.894-.936-1.444-.936zm8.689 0c-1.705 0-3.118 1.466-3.118 3.284 0 1.82 1.413 3.285 3.118 3.285.842 0 1.57-.312 2.131-.988v.82h1.632V8.883h-1.632v.822c-.561-.676-1.29-.988-2.131-.988zm4.064.166c.707 1.102 1.507 2.09 2.443 3.077a26.593 26.593 0 0 0-2.443 3.16h2.069a13.603 13.603 0 0 1 1.673-2.183 14.067 14.067 0 0 1 1.632 2.182H24a25.142 25.142 0 0 0-2.432-3.16A23.918 23.918 0 0 0 24 8.883h-2.047a14.65 14.65 0 0 1-1.674 2.11 13.357 13.357 0 0 1-1.674-2.11zm-3.804 1.279c1.018 0 1.84.82 1.84 1.84a1.837 1.837 0 0 1-1.84 1.839c-1.019 0-1.84-.82-1.84-1.84 0-1.018.821-1.84 1.84-1.84zm0 .415c-.78 0-1.414.633-1.414 1.423s.634 1.424 1.413 1.424c.78 0 1.414-.634 1.414-1.424s-.634-1.424-1.414-1.424z',
  },
  // Paramount+ — hex 0064FF
  'paramountplus': {
    hex: '0064FF',
    path: 'M16.347 21.373c.057-.084.151-.314-.025-.74l-.53-1.428c-.073-.182.084-.293.19-.173 0 0 1.004 1.157 1.264 1.64l.495.822c.425.028 1.6.06 2.732.06a3.26 3.26 0 0 1-.316-.364c-1.93-2.392-3.154-3.724-3.166-3.737-.391-.426-.572-.508-.87-.643a4.82 4.82 0 0 1-.138-.065v.364c0 .047-.057.073-.086.022l-2.846-5.001a1.598 1.598 0 0 0-.508-.587l-.277-.194-1.354 3.123c.212 0 .354.216.27.409l-1.25 2.893h1.147c.443 0 .883.087 1.294.255l.302.125s-.913 1.878-.913 2.867c0 .181.028.362.075.534h2.104l-.096-.595s1.266.294 2.502.413M12 2.437c-6.627 0-12 5.373-12 12 0 2.669.873 5.133 2.346 7.126.503-.218.783-.542.983-.791l2.234-2.858a.467.467 0 0 1 .179-.138l.336-.146 3.674-4.659.534-.417 1.094-1.524a.482.482 0 0 1 .101-.102l.478-.347a.34.34 0 0 1 .398-.004l.578.407c.308.216.557.504.726.84l2.322 4.077c.051.09.09.129.182.174.454.227.732.268 1.33.913.277.304 1.495 1.666 3.203 3.784.236.318.538.588.963.783A11.948 11.948 0 0 0 24 14.437c0-6.627-5.373-12-12-12M3.236 15.1l-.778-.253-.48.662v-.818l-.778-.253.778-.253v-.818l.48.662.778-.253-.48.662Zm-.185 2.676-.252.778-.253-.778h-.818l.661-.481-.253-.777.663.48.66-.48-.252.777.662.481Zm.156-6.195.253.778-.661-.48-.663.48.253-.778-.66-.48h.817l.253-.778.252.777h.818Zm1.314-1.76L4.04 9.16l-.778.253.48-.661-.48-.663.778.254.48-.662v.818l.778.253-.777.252Zm2.045-2.862-.253.777-.252-.777h-.818l.662-.48-.253-.778.661.48.661-.48-.252.777.662.48Zm2.577-1.313-.48.661V5.49l-.779-.254.778-.253v-.817l.48.66.78-.253-.481.663.48.66zm3.265-.75.253.778-.661-.48-.662.48.252-.777-.66-.481h.818L12 3.637l.252.778h.818zm2.93.595v.816l-.481-.661-.777.252.48-.662-.48-.662.777.253.48-.66v.817l.779.252zm5.426 8.285.778.253.48-.662v.818l.778.253-.778.253v.818l-.48-.662-.778.253.48-.662zm-3.077-6.04-.253-.777h-.818l.662-.48-.253-.778.662.48.662-.48-.254.778.662.48h-.818zm1.792 2.086v-.818l-.777-.252.777-.253V7.68l.481.662.777-.254-.48.663.48.66-.777-.252zm1.469 1.278.253-.777.254.777h.816l-.66.481.252.778-.662-.48-.661.48.253-.778-.662-.48zm.506 6.676-.253.778-.253-.778h-.817l.662-.481-.253-.777.66.48.663-.48-.253.777.661.481zm-12.08-.615.76-1.588c.024-.048-.032-.108-.067-.067l-.664.668c-.313.329-.847 1.25-.95 1.421l-.808 1.335a.109.109 0 0 1 .1.162l-.739 1.238c-.18.309.145.523.189.452 1.157-1.868 1.832-1.719 1.832-1.719l.387-.897c.022-.047-.001-.1-.05-.12-.12-.05-.316-.27.01-.885z',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// BrandIcon — renderiza SVG vectorial
// ─────────────────────────────────────────────────────────────────────────────

export function BrandIcon({ icon, size = 20, color }: {
  icon: SimpleIcon; size?: number; color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={icon.path} fill={color ?? `#${icon.hex}`} />
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SubIcon — logo SVG → letra con color (fallback)
// ─────────────────────────────────────────────────────────────────────────────

function luminance(hex: string): number {
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export function SubIcon({ name, subId, color, icon: iconName, size = 36, borderRadius = 9 }: {
  name: string; subId?: string; color: string;
  /** Ícono elegido a mano (ver `identityIcons`); si viene, anula logo y letra. */
  icon?: string;
  size?: number; borderRadius?: number;
}) {
  const dark = useColorScheme() === 'dark';
  const icon = iconName ? null : getBrandIcon(subId ?? '', name);
  const iconSize = Math.round(size * 0.56);

  if (iconName) {
    return (
      <View style={{
        width: size, height: size, borderRadius,
        backgroundColor: color,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Ionicons name={iconName as React.ComponentProps<typeof Ionicons>['name']} size={Math.round(size * 0.5)} color="#fff" />
      </View>
    );
  }

  if (icon) {
    const lum = luminance(icon.hex);
    // Fondo neutro (paleta blanco/negro): el logo conserva su color de marca,
    // salvo que sea casi invisible contra ese fondo (un logo oscuro/negro
    // como el de Prime Video sobre el fondo oscuro del modo oscuro), en cuyo
    // caso se vuelve blanco. En modo claro el umbral es mucho más estricto:
    // casi ningún color de marca "normal" se pierde sobre blanco.
    const bgColor    = dark ? '#1C1C1F' : '#FFFFFF';
    const invisible  = dark ? lum < 0.22 : lum > 0.94;
    const iconColor  = invisible ? (dark ? '#FFFFFF' : '#6B7280') : `#${icon.hex}`;

    return (
      <View style={{
        width: size, height: size, borderRadius,
        backgroundColor: bgColor,
        borderWidth: 1, borderColor: dark ? '#2A2A2E' : '#E4E4E7',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <BrandIcon icon={icon} size={iconSize} color={iconColor} />
      </View>
    );
  }

  return (
    <View style={{
      width: size, height: size, borderRadius,
      backgroundColor: color,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ color: '#fff', fontSize: Math.round(size * 0.44), fontWeight: '700' }}>
        {(name[0] ?? '?').toUpperCase()}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ID map — match exacto con IDs de constants/subscriptions.ts
// ─────────────────────────────────────────────────────────────────────────────

const ID_MAP: Record<string, SimpleIcon> = {
  // Streaming
  'netflix':           siNetflix,
  // Disney+ removido de simple-icons por la marca → fallback a letra D
  'max':               siHbo,
  'hbo':               siHbo,
  'prime-video':       siPrimevideo,
  'hulu':              { hex: '1CE783', path: 'M14.87 3.486H9.116v5.808H3.358V3.486H0v17.028h3.358v-8.193h5.758v8.193h3.754V3.486zm5.756 0h-3.358v17.028H24V17.49h-3.374V3.486z' },
  'youtube-premium':   siYoutube,
  'crunchyroll':       siCrunchyroll,
  'twitch':            siTwitch,
  'paramount':         MANUAL['paramountplus'],
  'peacock':           { hex: '000000', path: 'M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-.371 6.236c-.094 0-.281.047-.375.094L4.218 10.5c-.281.141-.375.375-.281.656l3.937 6.797c.141.234.375.328.61.234l7.079-4.125c.234-.14.375-.375.281-.656L11.906 6.61c-.094-.234-.187-.375-.281-.375h.004zm.371 2.062c.188 0 .375.047.562.094l3.797 6.563-6.328 3.703-3.797-6.563 5.766-3.703v-.094z' },
  // Música
  'spotify':           siSpotify,
  'apple-music':       siApplemusic,
  'deezer':            siDeezer,
  'tidal':             siTidal,
  'soundcloud':        siSoundcloud,
  // Apple
  'apple-tv':          siAppletv,
  'apple-one':         siApple,
  'icloud':            siIcloud,
  // Google
  'google-one':        siGoogle,
  'google-drive':      siGoogledrive,
  // Microsoft / Gaming
  'xbox-game-pass':    siXbox,
  'microsoft-365':     { ...siMicrosoft, hex: '0078D4' }, // simple-icons usa gris neutro; usamos azul oficial de Microsoft
  'steam':             siSteam,
  'epic-games':        siEpicgames,
  'ea-play':           siEa,
  'playstation':       siPlaystation,
  'nintendo':          { ...siNintendo, hex: 'E60012' },  // simple-icons usa gris; Nintendo es rojo
  'nintendo-switch':   { ...siNintendoswitch, hex: 'E60012' },
  // Productividad
  'notion':            siNotion,
  'dropbox':           siDropbox,
  'zoom':              siZoom,
  'asana':             siAsana,
  'jira':              siJira,
  'trello':            siTrello,
  'github':            siGithub,
  'discord':           siDiscord,
  'figma':             siFigma,
  'shopify':           siShopify,
  'wordpress':         siWordpress,
  // IA
  'openai':            siOpenai,
  'chatgpt':           siOpenai,
  'claude':            MANUAL['claude'],
  'claude-pro':        MANUAL['claude'],
  // Otros
  'nord-vpn':          siNordvpn,
  'duolingo':          siDuolingo,
  'amazon':            siAmazon,
};

// ─────────────────────────────────────────────────────────────────────────────
// Name map — regex para suscripciones creadas por el usuario
// ─────────────────────────────────────────────────────────────────────────────

const NAME_MAP: [RegExp, SimpleIcon][] = [
  [/netflix/i,                     siNetflix],
  // Disney+ → sin logo en simple-icons, usa letra fallback
  [/hbo|max/i,                      siHbo],
  [/prime\s*video|amazon\s*prime/i,siPrimevideo],
  [/\bhulu\b/i,                    ID_MAP['hulu']],
  [/youtube/i,                     siYoutube],
  [/crunchyroll/i,                 siCrunchyroll],
  [/\btwitch\b/i,                  siTwitch],
  [/paramount/i,                   MANUAL['paramountplus']],
  [/spotify/i,                     siSpotify],
  [/apple\s*music/i,               siApplemusic],
  [/deezer/i,                      siDeezer],
  [/tidal/i,                       siTidal],
  [/soundcloud/i,                  siSoundcloud],
  [/apple\s*tv/i,                  siAppletv],
  [/apple\s*one/i,                 siApple],
  [/icloud/i,                      siIcloud],
  [/google\s*drive/i,              siGoogledrive],
  [/google/i,                      siGoogle],
  [/microsoft|ms\s*365|office/i,   { ...siMicrosoft, hex: '0078D4' }],
  [/xbox/i,                        siXbox],
  [/\bsteam\b/i,                   siSteam],
  [/epic\s*games/i,                siEpicgames],
  [/\bea\b|electronic\s*arts/i,    siEa],
  [/playstation|ps\s*[345]/i,      siPlaystation],
  [/nintendo/i,                    { ...siNintendo, hex: 'E60012' }],
  [/notion/i,                      siNotion],
  [/dropbox/i,                     siDropbox],
  [/\bzoom\b/i,                    siZoom],
  [/asana/i,                       siAsana],
  [/jira/i,                        siJira],
  [/trello/i,                      siTrello],
  [/github/i,                      siGithub],
  [/discord/i,                     siDiscord],
  [/figma/i,                       siFigma],
  [/shopify/i,                     siShopify],
  [/wordpress/i,                   siWordpress],
  [/\bclaude\b/i,                  MANUAL['claude']],
  [/openai/i,                      siOpenai],
  [/chatgpt/i,                     siOpenai],
  [/nordvpn|nord\s*vpn/i,          siNordvpn],
  [/duolingo/i,                    siDuolingo],
  [/amazon/i,                      siAmazon],
];

// ─────────────────────────────────────────────────────────────────────────────

export function getBrandIcon(id: string, name: string): SimpleIcon | null {
  if (id && ID_MAP[id]) return ID_MAP[id];
  for (const [regex, icon] of NAME_MAP) {
    if (regex.test(name)) return icon;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────
// Color dinámico de una suscripción (para gráficas/barras)
// ─────────────────────────────────────────────────────────────────

/**
 * Color de marca del servicio (Netflix rojo, Spotify verde…). Si la marca es
 * negra/gris o no se reconoce, usa el color elegido por el usuario y, si éste
 * es un gris, un color de respaldo de la paleta vívida.
 */
export function brandColor(name: string, fallbackColor: string, vivid: readonly string[], index = 0): string {
  const icon = getBrandIcon('', name);
  const candidates = [icon ? `#${icon.hex}` : null, fallbackColor];
  for (const c of candidates) {
    if (!c || !/^#[0-9a-f]{6}$/i.test(c)) continue;
    const r = parseInt(c.slice(1, 3), 16), g = parseInt(c.slice(3, 5), 16), b = parseInt(c.slice(5, 7), 16);
    const sat = Math.max(r, g, b) - Math.min(r, g, b);
    if (sat > 40) return c; // tiene color real (no es gris/negro)
  }
  return vivid[index % vivid.length];
}
