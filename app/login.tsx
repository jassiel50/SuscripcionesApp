import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  OAuthProvider,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { auth } from '../src/firebase';
import { useTheme } from '../src/hooks/useTheme';
import { ScreenBackground } from '../src/components/ui/glass';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = '615750218210-l2k6iemmr1levo8fd5bjvm8art34qd2b.apps.googleusercontent.com';
const GOOGLE_IOS_CLIENT_ID = '615750218210-gachbo3litej24j5f4p7oratcnqvr48i.apps.googleusercontent.com';

type EmailMode = 'login' | 'register';

export default function LoginScreen() {
  const { colors } = useTheme();
  const [loading, setLoading] = useState<'google' | 'apple' | 'email' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showEmail, setShowEmail] = useState(false);
  const [emailMode, setEmailMode] = useState<EmailMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const [, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    scopes: ['openid', 'profile', 'email'],
    selectAccount: true,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      const idToken = authentication?.idToken ?? null;
      const accessToken = authentication?.accessToken ?? null;
      if (idToken || accessToken) {
        const credential = GoogleAuthProvider.credential(idToken, accessToken);
        signInWithCredential(auth, credential)
          .catch(() => setError('Error al iniciar sesión con Google'))
          .finally(() => setLoading(null));
      } else {
        setError('No se recibieron credenciales de Google');
        setLoading(null);
      }
    } else if (response?.type === 'error') {
      setError('Error al iniciar sesión con Google');
      setLoading(null);
    } else if (response?.type === 'dismiss' || response?.type === 'cancel') {
      setLoading(null);
    }
  }, [response]);

  const handleGoogle = async () => {
    setError(null);
    setLoading('google');
    await promptAsync();
  };

  const handleApple = async () => {
    setError(null);
    setLoading('apple');
    try {
      const result = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      const provider = new OAuthProvider('apple.com');
      const credential = provider.credential({ idToken: result.identityToken! });
      await signInWithCredential(auth, credential);
    } catch (e: any) {
      if (e.code !== 'ERR_REQUEST_CANCELED') {
        setError('No se pudo iniciar sesión con Apple');
      }
    } finally {
      setLoading(null);
    }
  };

  const handleEmail = async () => {
    if (!email.trim() || !password) {
      setError('Completa todos los campos');
      return;
    }
    setError(null);
    setLoading('email');
    try {
      if (emailMode === 'login') {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (e: any) {
      const msg: Record<string, string> = {
        'auth/invalid-email': 'El correo no es válido',
        'auth/user-not-found': 'No existe una cuenta con ese correo',
        'auth/wrong-password': 'Contraseña incorrecta',
        'auth/invalid-credential': 'Correo o contraseña incorrectos',
        'auth/email-already-in-use': 'Ya existe una cuenta con ese correo',
        'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
        'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
      };
      setError(msg[e.code] ?? 'Error al iniciar sesión');
    } finally {
      setLoading(null);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Escribe tu correo primero');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setResetSent(true);
      setError(null);
    } catch {
      setError('No se pudo enviar el correo de recuperación');
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <ScreenBackground scene="home" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand */}
          <Animated.View entering={FadeInUp.springify().damping(18)} style={s.brandSection}>
            <LinearGradient colors={colors.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.logo}>
              <Ionicons name="repeat" size={54} color={colors.onInk} />
            </LinearGradient>
            <Text style={[s.appName, { color: colors.text }]}>SUBLY</Text>
            <Text style={[s.tagline, { color: colors.subtext }]}>
              Todas tus suscripciones,{'\n'}un solo lugar.
            </Text>
            <View style={s.features}>
              {([['notifications', 'Recordatorios', 2], ['pie-chart', 'Estadísticas', 5], ['calendar', 'Calendario', 0]] as const).map(([icon, label, vividIdx]) => (
                <View key={label} style={[s.feature, { backgroundColor: colors.vivid[vividIdx] + '1A' }]}>
                  <Ionicons name={icon} size={14} color={colors.vivid[vividIdx]} />
                  <Text style={[s.featureText, { color: colors.vivid[vividIdx] }]}>{label}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Buttons */}
          <Animated.View entering={FadeInDown.delay(150).springify().damping(18)} style={s.btnSection}>
            {error && (
              <View style={[s.errorBox, { backgroundColor: '#FF3B3022', borderColor: '#FF3B30' }]}>
                <Ionicons name="alert-circle-outline" size={16} color="#FF3B30" />
                <Text style={s.errorText}>{error}</Text>
              </View>
            )}

            {resetSent && (
              <View style={[s.errorBox, { backgroundColor: colors.successSoft, borderColor: colors.success }]}>
                <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} />
                <Text style={[s.errorText, { color: colors.success }]}>
                  Correo de recuperación enviado
                </Text>
              </View>
            )}

            {/* Google */}
            <TouchableOpacity
              style={[s.btn, { backgroundColor: colors.surface, borderColor: colors.surface }]}
              onPress={handleGoogle}
              disabled={!!loading}
              activeOpacity={0.8}
            >
              {loading === 'google' ? (
                <ActivityIndicator color="#EA4335" />
              ) : (
                <>
                  <View style={s.gLogo}>
                    <Text style={s.gLogoText}>G</Text>
                  </View>
                  <Text style={[s.btnText, { color: colors.text }]}>Continuar con Google</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Apple — iOS only */}
            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={[s.btn, s.btnApple, { backgroundColor: colors.ink }]}
                onPress={handleApple}
                disabled={!!loading}
                activeOpacity={0.8}
              >
                {loading === 'apple' ? (
                  <ActivityIndicator color={colors.onInk} />
                ) : (
                  <>
                    <Ionicons name="logo-apple" size={22} color={colors.onInk} />
                    <Text style={[s.btnText, { color: colors.onInk }]}>Continuar con Apple</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Email toggle */}
            <TouchableOpacity
              style={[s.btn, { backgroundColor: colors.surface, borderColor: colors.surface }]}
              onPress={() => { setShowEmail(v => !v); setError(null); setResetSent(false); }}
              disabled={!!loading}
              activeOpacity={0.8}
            >
              <Ionicons name="mail-outline" size={20} color={colors.text} />
              <Text style={[s.btnText, { color: colors.text }]}>Continuar con email</Text>
              <Ionicons
                name={showEmail ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.subtext}
                style={{ marginLeft: 'auto' }}
              />
            </TouchableOpacity>

            {/* Email form */}
            {showEmail && (
              <View style={s.emailForm}>
                {/* Mode selector */}
                <View style={[s.modePicker, { backgroundColor: colors.surface, borderColor: colors.surface }]}>
                  {(['login', 'register'] as EmailMode[]).map(m => (
                    <TouchableOpacity
                      key={m}
                      style={[s.modeBtn, emailMode === m && { backgroundColor: colors.bg }]}
                      onPress={() => { setEmailMode(m); setError(null); setResetSent(false); }}
                    >
                      <Text style={[s.modeBtnText, { color: emailMode === m ? colors.vivid[0] : colors.subtext }]}>
                        {m === 'login' ? 'Iniciar sesión' : 'Registrarse'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Email input */}
                <View style={[s.input, { backgroundColor: colors.surface, borderColor: colors.surface }]}>
                  <Ionicons name="mail-outline" size={18} color={colors.subtext} />
                  <TextInput
                    style={[s.inputText, { color: colors.text }]}
                    placeholder="Correo electrónico"
                    placeholderTextColor={colors.subtext}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                  />
                </View>

                {/* Password input */}
                <View style={[s.input, { backgroundColor: colors.surface, borderColor: colors.surface }]}>
                  <Ionicons name="lock-closed-outline" size={18} color={colors.subtext} />
                  <TextInput
                    ref={passwordRef}
                    style={[s.inputText, { color: colors.text }]}
                    placeholder="Contraseña"
                    placeholderTextColor={colors.subtext}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPass}
                    returnKeyType="done"
                    onSubmitEditing={handleEmail}
                  />
                  <TouchableOpacity onPress={() => setShowPass(v => !v)} hitSlop={8}>
                    <Ionicons
                      name={showPass ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={colors.subtext}
                    />
                  </TouchableOpacity>
                </View>

                {/* Submit */}
                <TouchableOpacity onPress={handleEmail} disabled={!!loading} activeOpacity={0.85}>
                  <LinearGradient colors={colors.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[s.btn, { borderWidth: 0 }]}>
                    {loading === 'email' ? (
                      <ActivityIndicator color={colors.onInk} />
                    ) : (
                      <Text style={[s.btnText, { color: colors.onInk, fontWeight: '800' }]}>
                        {emailMode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Forgot password */}
                {emailMode === 'login' && (
                  <TouchableOpacity onPress={handleForgotPassword} style={s.forgotBtn}>
                    <Text style={[s.forgotText, { color: colors.vivid[0] }]}>
                      ¿Olvidaste tu contraseña?
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Microsoft — coming soon */}
            <TouchableOpacity
              style={[s.btn, { backgroundColor: colors.card, borderColor: colors.cardBorder, opacity: 0.4 }]}
              disabled
            >
              <FontAwesome name="windows" size={20} color="#00A4EF" />
              <Text style={[s.btnText, { color: colors.text }]}>Microsoft · Próximamente</Text>
            </TouchableOpacity>
          </Animated.View>

          <Text style={[s.legal, { color: colors.subtext }]}>
            Al continuar aceptas nuestros{' '}
            <Text style={{ fontWeight: '600' }}>Términos de servicio</Text>
            {' '}y{' '}
            <Text style={{ fontWeight: '600' }}>Política de privacidad</Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 16 },
  brandSection: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, minHeight: 220 },
  logo: {
    width: 108, height: 108, borderRadius: 34,
    alignItems: 'center', justifyContent: 'center', 
    shadowColor: '#000', shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.25, shadowRadius: 24, elevation: 12,
  },
  appName: { fontSize: 46, fontWeight: '900', letterSpacing: 3, marginTop: 8 },
  tagline: { fontSize: 18, fontWeight: '500', textAlign: 'center', lineHeight: 25 },
  features: { flexDirection: 'row', gap: 8, marginTop: 6, flexWrap: 'wrap', justifyContent: 'center' },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  featureText: { fontSize: 12, fontWeight: '600' },
  btnSection: { gap: 12, marginBottom: 20 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 10, padding: 10 },
  errorText: { color: '#FF3B30', fontSize: 14, flex: 1 },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 12, borderRadius: 999, paddingVertical: 17,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  btnApple: { backgroundColor: '#000', borderWidth: 0 },
  btnText: { fontSize: 16, fontWeight: '700' },
  gLogo: {
    width: 22, height: 22, borderRadius: 4,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#eee',
  },
  gLogoText: { fontSize: 14, fontWeight: '800', color: '#EA4335' },
  emailForm: { gap: 10 },
  modePicker: {
    flexDirection: 'row', borderRadius: 12, borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden', padding: 4, gap: 4,
  },
  modeBtn: { flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: 'center' },
  modeBtnText: { fontSize: 14, fontWeight: '600' },
  input: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 16, borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16, paddingVertical: 15,
  },
  inputText: { flex: 1, fontSize: 16 },
  forgotBtn: { alignItems: 'center', paddingVertical: 4 },
  forgotText: { fontSize: 14, fontWeight: '500' },
  legal: { textAlign: 'center', fontSize: 12, lineHeight: 18, marginBottom: 8 },
});
