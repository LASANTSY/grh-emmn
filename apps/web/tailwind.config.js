export default {
    content: ['./index.html', './src/**/*.{ts,tsx}'],
    theme: {
        extend: {
            colors: {
                marine: {
                    50: '#eef2f9', 100: '#d9e2f0', 200: '#b3c6df', 300: '#86a4c8',
                    400: '#5a82b0', 500: '#3b6399', 600: '#2c4d80', 700: '#1f3a64',
                    800: '#162b4c', 900: '#0f1e37', 950: '#081424',
                },
            },
            fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
        },
    },
    plugins: [require('tailwindcss-animate')],
};
