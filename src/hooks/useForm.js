import { useState } from 'react';

/**
 * Formularios con validación en tiempo real.
 * rules: { campo: (valor, todosLosValores) => 'mensaje' | '' }
 * El error aparece al salir del campo (onBlur) y se actualiza en cada cambio.
 */
export function useForm(initialValues, rules = {}) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const check = (name, value, all) => (rules[name] ? rules[name](value, all) : '');

  const handleChange = (e) => {
    const { name, value } = e.target;
    const next = { ...values, [name]: value };
    setValues(next);
    if (touched[name]) setErrors((p) => ({ ...p, [name]: check(name, value, next) }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((p) => ({ ...p, [name]: true }));
    setErrors((p) => ({ ...p, [name]: check(name, value, values) }));
  };

  const validateAll = () => {
    const keys = Object.keys(rules);
    const next = keys.reduce((acc, k) => ({ ...acc, [k]: check(k, values[k], values) }), {});
    setErrors(next);
    setTouched(keys.reduce((a, k) => ({ ...a, [k]: true }), {}));
    return Object.values(next).every((m) => !m);
  };

  const handleSubmit = (onValid) => (e) => {
    e.preventDefault();
    if (validateAll()) onValid(values);
  };

  const reset = () => { setValues(initialValues); setErrors({}); setTouched({}); };

  return { values, errors, touched, handleChange, handleBlur, handleSubmit, reset };
}
