import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import Alert from '../components/Alert.jsx';
import AuthTabs from '../components/AuthTabs.jsx';
import Button from '../components/Button.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import FormField from '../components/FormField.jsx';
import useAuth from '../hooks/useAuth.js';

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [errorRed, setErrorRed] = useState(null);
  const [invalidos, setInvalidos] = useState(0);
  const estado = location.state;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ mode: 'onBlur', defaultValues: { email: '', password: '' } });

  async function onSubmit(datos) {
    setErrorRed(null);
    setInvalidos(0);

    try {
      await login({ email: datos.email.trim(), password: datos.password });
      navigate(estado?.from ?? '/dashboard', { replace: true });
    } catch (error) {
      if (error.isNetworkError || (error.status && error.status >= 500)) {
        setErrorRed(error);
      } else {
        // Login incorrecto: el mensaje queda bajo el campo, sin redirigir ni alerta de página.
        setError('password', { type: 'server', message: error.message }, { shouldFocus: true });
      }
    }
  }

  return (
    <>
      <h1 className="m-0 text-app-page font-bold">Ingresá a tu cuenta</h1>
      <p className="m-0 mt-2 text-app-body-sm text-ink-muted">Usá el correo con el que te registraste.</p>

      <AuthTabs state={estado?.from ? { from: estado.from } : undefined} />

      {estado?.expirada && (
        <Alert tone="info" title="Tu sesión venció" className="mt-6">
          Ingresá de nuevo para seguir donde estabas.
        </Alert>
      )}

      <form
        noValidate
        onSubmit={handleSubmit(onSubmit, (fallas) => setInvalidos(Object.keys(fallas).length))}
        className="mt-6 flex flex-col gap-4"
      >
        <FormField
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email', {
            required: 'Ingresá tu email.',
            maxLength: { value: 120, message: 'El email admite hasta 120 caracteres.' },
            pattern: { value: EMAIL_VALIDO, message: 'Revisá el formato del email.' },
          })}
        />
        <FormField
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password', { required: 'Ingresá tu contraseña.' })}
        />

        <p role="status" className="sr-only">
          {invalidos > 0 ? `Revisá ${invalidos} ${invalidos === 1 ? 'campo' : 'campos'}` : ''}
        </p>

        {errorRed && <ErrorMessage error={errorRed} title="No pudimos iniciar sesión" />}

        <Button type="submit" className="w-full" pending={isSubmitting} pendingLabel="Ingresando…">
          Ingresar
        </Button>
      </form>

      <p className="m-0 mt-4 text-app-body-sm text-ink-faint">
        ¿Olvidaste tu contraseña? Todavía no hay recuperación: pedí ayuda al administrador.
      </p>
    </>
  );
}
