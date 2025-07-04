import * as React from 'react';

import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(false);

    React.useEffect(() => {
      setHasValue(!!props.value || !!props.defaultValue);
    }, [props.value, props.defaultValue]);

    return (
      <div className="relative group">
        <input
          type={type}
          className={cn(
            'peer w-full rounded-2xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm px-4 py-3 text-base text-gray-900 placeholder-transparent shadow-lg transition-all duration-300 outline-none',
            'focus:border-indigo-500 focus:shadow-indigo-500/25 focus:shadow-xl focus:ring-4 focus:ring-indigo-500/20',
            'hover:border-gray-300 hover:shadow-xl',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-100',
            error &&
              'border-red-500 focus:border-red-500 focus:ring-red-500/20',
            className
          )}
          ref={ref}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          onChange={(e) => {
            setHasValue(!!e.target.value);
            props.onChange?.(e);
          }}
          {...props}
        />
        {label && (
          <label
            className={cn(
              'absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 transition-all duration-300 pointer-events-none',
              'peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500',
              'peer-focus:top-2 peer-focus:-translate-y-0 peer-focus:text-xs peer-focus:text-indigo-600 peer-focus:font-semibold',
              (isFocused || hasValue) &&
                'top-2 -translate-y-0 text-xs text-indigo-600 font-semibold',
              error && 'peer-focus:text-red-600 text-red-600'
            )}
          >
            {label}
          </label>
        )}
        {error && (
          <p className="mt-2 text-sm text-red-600 animate-in slide-in-from-top-1 duration-300">
            {error}
          </p>
        )}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
