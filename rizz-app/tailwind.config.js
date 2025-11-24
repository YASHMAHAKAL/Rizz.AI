/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                coral: {
                    DEFAULT: '#FF6B6B',
                    soft: '#FF8585', // Slightly lighter for hover states
                },
                cream: {
                    DEFAULT: '#F7F7F7',
                    50: '#FFFFFF',
                    100: '#F7F7F7',
                    200: '#EFEFEF',
                },
                charcoal: {
                    DEFAULT: '#2D2D2D',
                    light: '#3D3D3D',
                    dark: '#1A1A1A',
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
            }
        },
    },
    plugins: [],
}
